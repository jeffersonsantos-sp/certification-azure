from typing import Any, Self
from urllib.parse import quote

import httpx

from app.core.azure import AzurePrincipal

ARM_BASE_URL = "https://management.azure.com"
RESOURCE_GRAPH_API_VERSION = "2022-10-01"
ROLE_ASSIGNMENTS_API_VERSION = "2022-04-01"
ROLE_DEFINITIONS_API_VERSION = "2022-04-01"

BUILTIN_ROLE_IDS = {
    "reader": "acdd72a7-3385-48ef-bd42-f606fba81ae7",
}


class AzureClientError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class AzureClient:
    def __init__(self, access_token: str):
        self._client = httpx.AsyncClient(
            base_url=ARM_BASE_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=25,
        )

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_args) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, str] | None = None,
        json: dict | None = None,
        allow_404: bool = False,
    ) -> dict | None:
        try:
            response = await self._client.request(method, path, params=params, json=json)
        except httpx.HTTPError as exc:
            raise AzureClientError("Unable to reach Azure Resource Manager") from exc

        if allow_404 and response.status_code == 404:
            return None

        if response.status_code >= 400:
            detail = response.text[:300]
            try:
                payload = response.json()
                detail = (
                    payload.get("error", {}).get("message")
                    or payload.get("message")
                    or detail
                )
            except ValueError:
                pass
            raise AzureClientError(
                f"Azure request failed ({response.status_code}): {detail}",
                response.status_code,
            )

        if response.status_code == 204 or not response.content:
            return {}
        try:
            return response.json()
        except ValueError as exc:
            raise AzureClientError("Azure returned an invalid response") from exc

    async def list_subscriptions(self) -> list[dict]:
        payload = await self._request(
            "GET",
            "/subscriptions",
            params={"api-version": "2022-12-01"},
        )
        return payload.get("value", []) if payload else []

    async def get_resource_group(
        self,
        subscription_id: str,
        resource_group: str,
    ) -> dict | None:
        return await self._request(
            "GET",
            (
                f"/subscriptions/{quote(subscription_id)}"
                f"/resourcegroups/{quote(resource_group)}"
            ),
            params={"api-version": "2021-04-01"},
            allow_404=True,
        )

    async def get_blob_container(
        self,
        subscription_id: str,
        resource_group: str,
        account_name: str,
        container_name: str,
    ) -> dict | None:
        return await self._request(
            "GET",
            (
                f"/subscriptions/{quote(subscription_id)}"
                f"/resourceGroups/{quote(resource_group)}"
                f"/providers/Microsoft.Storage/storageAccounts/{quote(account_name)}"
                f"/blobServices/default/containers/{quote(container_name)}"
            ),
            params={"api-version": "2023-01-01"},
            allow_404=True,
        )

    async def query_resources(self, subscription_id: str, query: str) -> list[dict]:
        payload = await self._request(
            "POST",
            "/providers/Microsoft.ResourceGraph/resources",
            params={"api-version": RESOURCE_GRAPH_API_VERSION},
            json={
                "subscriptions": [subscription_id],
                "query": query,
                "options": {"resultFormat": "objectArray"},
            },
        )
        return payload.get("data", []) if payload else []

    async def list_role_assignments(
        self,
        subscription_id: str,
        resource_group: str,
    ) -> list[dict]:
        payload = await self._request(
            "GET",
            (
                f"/subscriptions/{quote(subscription_id)}"
                f"/resourceGroups/{quote(resource_group)}"
                "/providers/Microsoft.Authorization/roleAssignments"
            ),
            params={"api-version": ROLE_ASSIGNMENTS_API_VERSION},
        )
        return payload.get("value", []) if payload else []

    async def list_policy_assignments(
        self,
        subscription_id: str,
        resource_group: str,
    ) -> list[dict]:
        payload = await self._request(
            "GET",
            (
                f"/subscriptions/{quote(subscription_id)}"
                f"/resourceGroups/{quote(resource_group)}"
                "/providers/Microsoft.Authorization/policyAssignments"
            ),
            params={"api-version": "2022-06-01"},
        )
        return payload.get("value", []) if payload else []

    async def list_resource_locks(
        self,
        subscription_id: str,
        resource_group: str,
    ) -> list[dict]:
        payload = await self._request(
            "GET",
            (
                f"/subscriptions/{quote(subscription_id)}"
                f"/resourceGroups/{quote(resource_group)}"
                "/providers/Microsoft.Authorization/locks"
            ),
            params={"api-version": "2020-05-01"},
        )
        return payload.get("value", []) if payload else []

    async def list_vnet_peerings(
        self,
        subscription_id: str,
        resource_group: str,
        vnet_name: str,
    ) -> list[dict]:
        payload = await self._request(
            "GET",
            (
                f"/subscriptions/{quote(subscription_id)}"
                f"/resourceGroups/{quote(resource_group)}"
                f"/providers/Microsoft.Network/virtualNetworks/{quote(vnet_name)}"
                "/virtualNetworkPeerings"
            ),
            params={"api-version": "2022-01-01"},
        )
        return payload.get("value", []) if payload else []

    async def get_load_balancer(
        self,
        subscription_id: str,
        resource_group: str,
        name: str,
    ) -> dict | None:
        return await self._request(
            "GET",
            (
                f"/subscriptions/{quote(subscription_id)}"
                f"/resourceGroups/{quote(resource_group)}"
                f"/providers/Microsoft.Network/loadBalancers/{quote(name)}"
            ),
            params={"api-version": "2022-01-01"},
            allow_404=True,
        )

    async def get_role_definition_id(self, subscription_id: str, role_name: str) -> str | None:
        payload = await self._request(
            "GET",
            f"/subscriptions/{quote(subscription_id)}/providers/Microsoft.Authorization/roleDefinitions",
            params={"api-version": ROLE_DEFINITIONS_API_VERSION},
        )
        for definition in (payload or {}).get("value", []):
            properties = definition.get("properties") or {}
            if str(properties.get("roleName", "")).lower() == role_name.lower():
                return str(definition.get("name") or definition.get("id", "").rsplit("/", 1)[-1])

        return BUILTIN_ROLE_IDS.get(role_name.lower())


def _escape_kql(value: str) -> str:
    return value.replace("'", "''")


def _get_path(value: Any, path: str) -> Any:
    current = value
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _values_equal(actual: Any, expected: Any) -> bool:
    if isinstance(expected, list):
        if not isinstance(actual, list) or len(actual) != len(expected):
            return False
        return sorted(str(item).lower() for item in actual) == sorted(
            str(item).lower() for item in expected
        )
    if isinstance(expected, str) and isinstance(actual, str):
        return actual.lower() == expected.lower()
    return actual == expected


def _tags_equal(actual: Any, expected: Any) -> bool:
    if not isinstance(actual, dict) or not isinstance(expected, dict):
        return False
    actual_lower = {str(key).lower(): value for key, value in actual.items()}
    expected_lower = {str(key).lower(): value for key, value in expected.items()}
    return all(actual_lower.get(key) == value for key, value in expected_lower.items())


class LabValidator:
    def __init__(
        self,
        client: AzureClient,
        subscription_id: str,
        resource_group: str,
        principal: AzurePrincipal,
    ):
        self.client = client
        self.subscription_id = subscription_id
        self.resource_group = resource_group
        self.principal = principal
        self._resource_group_loaded = False
        self._resource_group_data: dict | None = None
        self._resource_cache: dict[str, list[dict]] = {}
        self._role_definition_id: str | None = None

    async def run(self, checks: list) -> list[dict]:
        results = []
        for check in checks:
            try:
                status, message, details = await self._run_check(check)
            except AzureClientError as exc:
                status = "error"
                message = str(exc)
                details = {}
            results.append(
                {
                    "key": check.key,
                    "name": check.name,
                    "description": check.description,
                    "required": check.required,
                    "weight": check.weight,
                    "status": status,
                    "message": message,
                    "details": details,
                }
            )
        return results

    async def _run_check(self, check) -> tuple[str, str, dict]:
        config = check.config or {}
        check_type = check.check_type.value

        if check_type == "manual":
            return "skipped", "Manual check. Review this step in the Azure portal.", {}
        if check_type == "resource_exists":
            return await self._check_resource_exists(config)
        if check_type == "resource_count":
            return await self._check_resource_count(config)
        if check_type == "property_equals":
            return await self._check_property_equals(config)
        if check_type == "tag_equals":
            return await self._check_tag_equals(config)
        if check_type == "role_assignment_exists":
            return await self._check_role_assignment_exists(config)
        if check_type == "subnet_exists":
            return await self._check_subnet_exists(config)
        if check_type == "nsg_rule_exists":
            return await self._check_nsg_rule_exists(config)
        if check_type == "group_role_assignment_exists":
            return await self._check_group_role_assignment_exists(config)
        if check_type == "policy_assignment_exists":
            return await self._check_policy_assignment_exists(config)
        if check_type == "resource_lock_exists":
            return await self._check_resource_lock_exists(config)
        if check_type == "virtual_network_peering_exists":
            return await self._check_virtual_network_peering_exists(config)
        if check_type == "load_balancer_probe_exists":
            return await self._check_load_balancer_probe_exists(config)

        return "error", f"Unsupported check type: {check_type}", {}

    async def _load_resource_group(self) -> dict | None:
        if not self._resource_group_loaded:
            self._resource_group_data = await self.client.get_resource_group(
                self.subscription_id,
                self.resource_group,
            )
            self._resource_group_loaded = True
        return self._resource_group_data

    async def _resources_of_type(self, resource_type: str) -> list[dict]:
        key = resource_type.lower()
        if key not in self._resource_cache:
            query = (
                "Resources"
                f" | where resourceGroup =~ '{_escape_kql(self.resource_group)}'"
                f" | where type =~ '{_escape_kql(resource_type)}'"
                " | project id, name, type, location, tags, properties, sku, kind"
            )
            self._resource_cache[key] = await self.client.query_resources(
                self.subscription_id,
                query,
            )
        return self._resource_cache[key]

    async def _matching_resources(self, config: dict) -> list[dict]:
        resource_type = str(config.get("resource_type", ""))
        if not resource_type:
            return []

        resources = await self._resources_of_type(resource_type)
        name = str(config.get("name", ""))
        name_prefix = str(config.get("name_prefix", ""))
        parent_name_prefix = str(config.get("parent_name_prefix", ""))

        matches = []
        for resource in resources:
            resource_name = str(resource.get("name", ""))
            if name and resource_name.lower() != name.lower():
                continue
            if name_prefix and not resource_name.lower().startswith(name_prefix.lower()):
                continue
            if parent_name_prefix and not self._parent_matches(
                str(resource.get("id", "")),
                parent_name_prefix,
            ):
                continue
            matches.append(resource)
        return matches

    @staticmethod
    def _parent_matches(resource_id: str, prefix: str) -> bool:
        parts = [part for part in resource_id.split("/") if part]
        return any(part.lower().startswith(prefix.lower()) for part in parts[:-1])

    async def _check_resource_exists(self, config: dict) -> tuple[str, str, dict]:
        resource_type = str(config.get("resource_type", ""))
        name = str(config.get("name", ""))
        name_prefix = str(config.get("name_prefix", ""))

        if resource_type.lower() == "microsoft.resources/resourcegroups":
            resource_group = await self._load_resource_group()
            if resource_group is None:
                return "failed", f"Resource group {self.resource_group} was not found.", {}
            actual_name = str(resource_group.get("name", ""))
            if name and actual_name.lower() != name.lower():
                return "failed", f"Resource group name is {actual_name}.", {}
            if name_prefix and not actual_name.lower().startswith(name_prefix.lower()):
                return "failed", f"Resource group name is {actual_name}.", {}
            return "passed", f"Resource group {actual_name} exists.", {"resource_id": resource_group.get("id")}

        if resource_type.lower() == "microsoft.storage/storageaccounts/blobservices/containers":
            return await self._check_blob_container_exists(config)

        resources = await self._matching_resources(config)
        if resources:
            return (
                "passed",
                f"Found {len(resources)} matching resource(s).",
                {"resource_ids": [resource.get("id") for resource in resources[:5]]},
            )
        return "failed", "No matching Azure resource was found.", {}

    async def _check_blob_container_exists(self, config: dict) -> tuple[str, str, dict]:
        container_name = str(config.get("name", ""))
        account_name = str(config.get("account_name", ""))
        account_prefix = str(
            config.get("parent_name_prefix", config.get("account_name_prefix", ""))
        )
        accounts = await self._matching_resources(
            {
                "resource_type": "Microsoft.Storage/storageAccounts",
                "name": account_name,
                "name_prefix": account_prefix,
            }
        )
        if not accounts:
            return "failed", "The Storage Account for this container was not found.", {}

        for account in accounts:
            actual_account = str(account.get("name", ""))
            container = await self.client.get_blob_container(
                self.subscription_id,
                self.resource_group,
                actual_account,
                container_name,
            )
            if container is not None:
                return (
                    "passed",
                    f"Blob container {container_name} exists in {actual_account}.",
                    {"resource_id": container.get("id")},
                )

        return (
            "failed",
            f"Blob container {container_name} was not found in the matching Storage Account.",
            {},
        )

    async def _check_resource_count(self, config: dict) -> tuple[str, str, dict]:
        resources = await self._matching_resources(config)
        expected = int(config.get("count", config.get("min_count", 1)))
        actual = len(resources)
        passed = actual >= expected if "min_count" in config else actual == expected
        message = f"Expected {expected} matching resource(s); found {actual}."
        return ("passed" if passed else "failed"), message, {"actual": actual, "expected": expected}

    async def _check_property_equals(self, config: dict) -> tuple[str, str, dict]:
        path = str(config.get("path", ""))
        expected = config.get("value")

        if str(config.get("resource_type", "")).lower() == "microsoft.resources/resourcegroups":
            resources = [await self._load_resource_group()]
        else:
            resources = await self._matching_resources(config)

        resources = [resource for resource in resources if resource]
        if not resources:
            return "failed", "The resource to inspect was not found.", {}

        actual_values = [_get_path(resource, path) for resource in resources]
        if any(_values_equal(actual, expected) for actual in actual_values):
            return "passed", f"{path} matches the expected value.", {"expected": expected}
        return (
            "failed",
            f"{path} does not match the expected value.",
            {"expected": expected, "actual": actual_values[:5]},
        )

    async def _check_tag_equals(self, config: dict) -> tuple[str, str, dict]:
        tag = str(config.get("tag", ""))
        expected = str(config.get("value", ""))
        expected_tags = {tag: expected}

        if str(config.get("resource_type", "")).lower() == "microsoft.resources/resourcegroups":
            resources = [await self._load_resource_group()]
        else:
            resources = await self._matching_resources(config)

        resources = [resource for resource in resources if resource]
        if not resources:
            return "failed", "The resource to inspect was not found.", {}
        if any(_tags_equal(resource.get("tags"), expected_tags) for resource in resources):
            return "passed", f"Tag {tag}={expected} is present.", {}
        return "failed", f"Tag {tag}={expected} was not found.", {}

    async def _check_role_assignment_exists(self, config: dict) -> tuple[str, str, dict]:
        role_name = str(config.get("role_definition_name", "Reader"))
        if self._role_definition_id is None:
            self._role_definition_id = await self.client.get_role_definition_id(
                self.subscription_id,
                role_name,
            )
        if not self._role_definition_id:
            return "error", f"Role definition {role_name} was not found.", {}

        expected_scope = (
            f"/subscriptions/{self.subscription_id}"
            f"/resourceGroups/{self.resource_group}"
        ).lower()
        principal_id = self.principal.object_id
        assignments = await self.client.list_role_assignments(
            self.subscription_id,
            self.resource_group,
        )

        for assignment in assignments:
            properties = assignment.get("properties") or {}
            role_id = str(properties.get("roleDefinitionId", "")).lower()
            if (
                str(properties.get("principalId", "")).lower() == principal_id.lower()
                and str(properties.get("scope", "")).lower() == expected_scope
                and role_id.endswith(self._role_definition_id.lower())
            ):
                return "passed", f"{role_name} is assigned to the signed-in user.", {}

        return (
            "failed",
            f"{role_name} is not assigned to the signed-in user at resource group scope.",
            {},
        )

    async def _check_group_role_assignment_exists(self, config: dict) -> tuple[str, str, dict]:
        role_name = str(config.get("role_definition_name", "Reader"))
        if self._role_definition_id is None:
            self._role_definition_id = await self.client.get_role_definition_id(
                self.subscription_id,
                role_name,
            )
        if not self._role_definition_id:
            return "error", f"Role definition {role_name} was not found.", {}

        expected_scope = (
            f"/subscriptions/{self.subscription_id}"
            f"/resourceGroups/{self.resource_group}"
        ).lower()
        assignments = await self.client.list_role_assignments(
            self.subscription_id,
            self.resource_group,
        )
        for assignment in assignments:
            properties = assignment.get("properties") or {}
            principal_type = str(properties.get("principalType", "")).lower()
            role_id = str(properties.get("roleDefinitionId", "")).lower()
            scope = str(properties.get("scope", "")).lower()
            if principal_type != "group":
                continue
            if not role_id.endswith(self._role_definition_id.lower()):
                continue
            if not scope.startswith(expected_scope):
                continue
            return (
                "passed",
                f"{role_name} is assigned to an Entra group at resource group scope.",
                {"assignment_id": assignment.get("id")},
            )

        return (
            "failed",
            f"No Entra group has the {role_name} role at resource group scope.",
            {},
        )

    async def _check_policy_assignment_exists(self, config: dict) -> tuple[str, str, dict]:
        display_name = str(config.get("display_name", ""))
        policy_definition_id = str(config.get("policy_definition_id", ""))
        enforcement_mode = config.get("enforcement_mode")

        assignments = await self.client.list_policy_assignments(
            self.subscription_id,
            self.resource_group,
        )
        for assignment in assignments:
            properties = assignment.get("properties") or {}
            if (
                display_name
                and str(properties.get("displayName", "")).lower() != display_name.lower()
            ):
                continue
            if (
                policy_definition_id
                and policy_definition_id.lower()
                not in str(properties.get("policyDefinitionId", "")).lower()
            ):
                continue
            if (
                enforcement_mode
                and str(properties.get("enforcementMode", "")).lower()
                != str(enforcement_mode).lower()
            ):
                continue
            return (
                "passed",
                f"Policy assignment {display_name or properties.get('displayName')} exists.",
                {"assignment_id": assignment.get("id")},
            )

        return "failed", f"Policy assignment {display_name or config.get('key')} was not found.", {}

    async def _check_resource_lock_exists(self, config: dict) -> tuple[str, str, dict]:
        lock_name = str(config.get("name", ""))
        level = config.get("level")

        locks = await self.client.list_resource_locks(
            self.subscription_id,
            self.resource_group,
        )
        for lock in locks:
            properties = lock.get("properties") or {}
            if lock_name and str(lock.get("name", "")).lower() != lock_name.lower():
                continue
            if level and str(properties.get("level", "")).lower() != str(level).lower():
                continue
            return (
                "passed",
                f"Resource lock {lock.get('name')} exists with level {properties.get('level')}.",
                {"lock_id": lock.get("id")},
            )

        return "failed", f"Resource lock {lock_name or config.get('key')} was not found.", {}

    async def _check_virtual_network_peering_exists(
        self, config: dict
    ) -> tuple[str, str, dict]:
        vnet_name = str(config.get("vnet_name", ""))
        peering_name = str(config.get("peering_name", ""))
        remote_vnet_name = str(config.get("remote_vnet_name", ""))
        peering_state = str(config.get("peering_state", "Connected"))

        peerings = await self.client.list_vnet_peerings(
            self.subscription_id,
            self.resource_group,
            vnet_name,
        )
        for peering in peerings:
            properties = peering.get("properties") or {}
            if peering_name and str(peering.get("name", "")).lower() != peering_name.lower():
                continue
            remote_id = str(
                (properties.get("remoteVirtualNetwork") or {}).get("id", "")
            )
            if remote_vnet_name and not remote_id.lower().endswith(
                f"/{remote_vnet_name}".lower()
            ):
                continue
            if peering_state and str(properties.get("peeringState", "")).lower() != peering_state.lower():
                continue
            return (
                "passed",
                f"VNet peering {peering.get('name')} is {properties.get('peeringState')}.",
                {"peering_id": peering.get("id")},
            )

        return "failed", f"VNet peering {peering_name} was not found on {vnet_name}.", {}

    async def _check_load_balancer_probe_exists(
        self, config: dict
    ) -> tuple[str, str, dict]:
        load_balancer_name = str(config.get("load_balancer_name", ""))
        probe_name = str(config.get("probe_name", ""))
        protocol = config.get("protocol")
        port = config.get("port")

        load_balancer = await self.client.get_load_balancer(
            self.subscription_id,
            self.resource_group,
            load_balancer_name,
        )
        if load_balancer is None:
            return "failed", f"Load Balancer {load_balancer_name} was not found.", {}

        probes = (load_balancer.get("properties") or {}).get("probes") or []
        for probe in probes:
            properties = probe.get("properties") or {}
            if probe_name and str(probe.get("name", "")).lower() != probe_name.lower():
                continue
            if protocol and str(properties.get("protocol", "")).lower() != str(protocol).lower():
                continue
            if port is not None and str(properties.get("port", "")) != str(port):
                continue
            return (
                "passed",
                f"Load Balancer probe {probe.get('name')} exists.",
                {"probe_id": probe.get("id")},
            )

        return "failed", f"Load Balancer probe {probe_name} was not found.", {}

    async def _check_subnet_exists(self, config: dict) -> tuple[str, str, dict]:
        vnet_name = str(config.get("vnet_name", ""))
        subnet_name = str(config.get("subnet_name", ""))
        address_prefix = config.get("address_prefix")

        resources = await self._matching_resources(
            {
                "resource_type": "Microsoft.Network/virtualNetworks",
                "name": vnet_name,
            }
        )
        if not resources:
            return "failed", f"Virtual Network {vnet_name} was not found.", {}

        for resource in resources:
            subnets = (resource.get("properties") or {}).get("subnets") or []
            for subnet in subnets:
                if str(subnet.get("name", "")).lower() != subnet_name.lower():
                    continue
                if address_prefix:
                    properties = subnet.get("properties") or {}
                    prefixes = properties.get("addressPrefixes") or []
                    actual_prefix = properties.get("addressPrefix")
                    if actual_prefix and str(actual_prefix).lower() == str(address_prefix).lower():
                        return "passed", f"Subnet {subnet_name} exists with the expected prefix.", {}
                    if any(
                        str(prefix).lower() == str(address_prefix).lower()
                        for prefix in prefixes
                    ):
                        return "passed", f"Subnet {subnet_name} exists with the expected prefix.", {}
                    return "failed", f"Subnet {subnet_name} has a different address prefix.", {}
                return "passed", f"Subnet {subnet_name} exists.", {}

        return "failed", f"Subnet {subnet_name} was not found in {vnet_name}.", {}

    async def _check_nsg_rule_exists(self, config: dict) -> tuple[str, str, dict]:
        nsg_name = str(config.get("nsg_name", ""))
        rule_name = str(config.get("rule_name", ""))
        expected_port = str(config.get("destination_port", ""))

        resources = await self._matching_resources(
            {
                "resource_type": "Microsoft.Network/networkSecurityGroups",
                "name": nsg_name,
            }
        )
        if not resources:
            return "failed", f"Network Security Group {nsg_name} was not found.", {}

        for resource in resources:
            rules = (resource.get("properties") or {}).get("securityRules") or []
            for rule in rules:
                if str(rule.get("name", "")).lower() != rule_name.lower():
                    continue
                properties = rule.get("properties") or {}
                checks = {
                    "direction": str(properties.get("direction", "")).lower()
                    == str(config.get("direction", "Inbound")).lower(),
                    "access": str(properties.get("access", "")).lower()
                    == str(config.get("access", "Allow")).lower(),
                    "protocol": str(properties.get("protocol", "")).lower()
                    == str(config.get("protocol", "Tcp")).lower(),
                }
                if expected_port:
                    ports = {str(properties.get("destinationPortRange", ""))}
                    ports.update(
                        str(port)
                        for port in (properties.get("destinationPortRanges") or [])
                    )
                    checks["destination_port"] = expected_port in ports or "*" in ports

                if all(checks.values()):
                    return "passed", f"NSG rule {rule_name} matches the expected settings.", {}
                return "failed", f"NSG rule {rule_name} exists but has different settings.", {}

        return "failed", f"NSG rule {rule_name} was not found in {nsg_name}.", {}
