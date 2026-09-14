# API Designer Skill

## Purpose
Design and review RESTful APIs following best practices and standards.

## When to Use
- When creating new API endpoints
- When refactoring existing APIs
- When documenting API contracts
- When designing API versioning strategies

## Instructions

1. **RESTful Design Principles**:
   - Use nouns for resources, not verbs
   - Use HTTP methods appropriately (GET, POST, PUT, DELETE)
   - Implement proper status codes
   - Use plural nouns for collections
   - Support filtering, sorting, and pagination

2. **Request/Response Format**:
   - Use JSON for request/response bodies
   - Maintain consistent response structure
   - Include proper error messages
   - Use ISO 8601 for dates
   - Implement HATEOAS where beneficial

3. **Authentication & Authorization**:
   - Use JWT for stateless authentication
   - Implement proper token refresh
   - Use role-based access control (RBAC)
   - Validate permissions at endpoint level

4. **Versioning Strategy**:
   - Use URL versioning (/api/v1/, /api/v2/)
   - Maintain backward compatibility
   - Deprecate old versions gracefully
   - Document version changes

## API Response Structure

### Success Response
```json
{
  "data": {},
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Status Codes Usage
- `200` - Success
- `201` - Created
- `204` - No Content (deletion)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error
