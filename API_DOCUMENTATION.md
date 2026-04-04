# THE-ULTIMATE-SONGS API Documentation v1.0

Welcome to the technical reference for **THE-ULTIMATE-SONGS** backend. This documentation is designed to help developers understand and integrate with our music platform's core services.

---

## 🚀 Getting Started

### Base URL

All API requests should be made to one of the following:

- **Local Development**: `http://localhost:5000`
- **Production**: `https://your-app.vercel.app`

### Quick Start with Auth

1. **Register** a new account at `/api/auth/register`.
2. **Login** at `/api/auth/login` to receive a `jwt` cookie.
3. **Include** `withCredentials: true` in your axios/fetch requests to send the session cookie automatically.

---

## 🔒 Authentication (`/api/auth`)

Manage user sessions, registration, and identity.

### 1. Register User

Create a new user account. Returns user data and sets a session cookie.

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:

```json
{
  "username": "monu123",
  "email": "monu@example.com",
  "password": "strongPassword123"
}
```

- **Response (201 Created)**:

```json
{
  "_id": "65f...",
  "username": "monu123",
  "email": "monu@example.com",
  "role": "user"
}
```

### 2. Login User

Authenticates user and sets the `jwt` cookie.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**: `{ "email": "...", "password": "..." }`
- **Response (200 OK)**: User profile data.

### 3. Check Username Availability

Helpful for real-time validation during registration.

- **URL**: `/api/auth/check-username/:username`
- **Method**: `GET`
- **Response (200 OK)**:

```json
{
  "available": true,
  "message": "Username is available"
}
```

---

## 📂 Playlists (`/api/playlists`)

Manage personal and public music collections.

### 1. Create Playlist

- **URL**: `/api/playlists`
- **Method**: `POST`
- **Body**: `{ "name": "Chill Vibes", "description": "Lofi songs", "isPublic": true }`

### 2. Get Single Playlist (Detailed)

Returns full playlist metadata and a paginated list of song IDs.

- **URL**: `/api/playlists/:id?page=1&limit=50`
- **Method**: `GET`
- **Response (200 OK)**:

```json
{
  "_id": "...",
  "name": "Chill Vibes",
  "owner": { "username": "monu123" },
  "songs": ["songId1", "songId2"],
  "totalSongs": 150,
  "page": 1,
  "totalPages": 3
}
```

### 3. Reorder Songs

Used for drag-and-drop reordering.

- **URL**: `/api/playlists/:id/songs/reorder`
- **Method**: `PUT`
- **Body**: `{ "songIds": ["id2", "id1", "id3", ...] }`

### 4. Import Playlist

Clone a public playlist from another user.

- **URL**: `/api/playlists/:id/import`
- **Method**: `POST`
- **Logic**: Creates a new copy for the logged-in user with "(from Username)" suffix.

---

## ❤️ User Customization (`/api/users`)

Manage global user states like "Liked Songs."

### 1. Like a Song

- **URL**: `/api/users/likes`
- **Method**: `POST`
- **Body**: `{ "id": "song_jiosaavn_id" }`

### 2. Bulk Import Likes

Used when importing songs from an external source or shared link.

- **URL**: `/api/users/likes/import`
- **Method**: `POST`
- **Body**: `{ "songIds": ["id1", "id2"] }`

---

## 🛡️ Admin Controls (`/api/admin`)

Manage platform users and roles. Requires `admin` status.

- **GET `/`**: Returns all registered users.
- **DELETE `/:id`**: Permanent account removal.
- **PUT `/:id/role`**: Upgrade user to `admin` or downgrade to `user`.

### Playlists

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/playlists/collaborations` | GET | Private | Get playlists where user is a collaborator |
| `/api/playlists/:id/collaborators` | POST | Private | Add a collaborator (Owner/Collab only) |
| `/api/playlists/:id/collaborators/:userId` | DELETE | Private | Remove a collaborator |

### User & Likes

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/users/history` | GET | Private | Get user's unique last 50 songs |

---

## ⚠️ Standard Status Codes

| Code | Meaning | Reason |
| :--- | :--- | :--- |
| **200** | OK | Request successful. |
| **201** | Created | Resource (User/Playlist) created successfully. |
| **400** | Bad Request | Missing fields or invalid data. |
| **401** | Unauthorized | Token missing or invalid. |
| **403** | Forbidden | Trying to access someone else's private data. |
| **404** | Not Found | Resource ID does not exist. |
| **500** | Server Error | Internal server issue. |

---

## 📦 Data Schemas

### User Object

```json
{
  "_id": "60d...",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "likedSongs": ["songId1", "songId2"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Playlist Object

```json
{
  "_id": "70d...",
  "name": "Summer Hits",
  "description": "Best of 2024",
  "owner": "60d...",
  "songs": ["id1", "id2"],
  "isPublic": true,
  "songCount": 2
}
```

---

## ⚠️ Error Responses

All errors follow this standard format:

```json
{
  "message": "Error message description",
  "stack": "Stack trace (Only in Development mode)"
}
```
