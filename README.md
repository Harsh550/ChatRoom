# SyncSpace

Real-time chat and collaboration platform built with React, Tailwind CSS, Node.js, Express, Socket.IO, MongoDB/Mongoose and JWT.

## Features
- JWT authentication
- Public rooms with discover/join flow
- Unread message badges with local persistence
- Rename public rooms (creator only)
- Delete DM conversations for yourself
- Delete messages for everyone
- Edit messages
- Private DMs
- Real-time messaging with Socket.IO
- Typing indicators
- Online/offline presence + last seen
- Read receipts
- Cursor-based message pagination / upward infinite scroll
- Responsive Tailwind UI
- REST APIs for auth, rooms and message history

## Setup

### Server
```bash
cd server
npm install
cp .env.example .env
# add MONGODB_URI and JWT_SECRET
npm run dev
```

### Client
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Default client: http://localhost:5173
Default server: http://localhost:5000

For production, set:
- `CLIENT_URL` on the server to your Vercel frontend URL
- `VITE_API_URL` on the client to your Render server URL
- `VITE_SOCKET_URL` on the client to your Render server URL

## API
POST `/api/auth/register`
POST `/api/auth/login`
GET `/api/auth/me`

GET `/api/rooms`
POST `/api/rooms`
PATCH `/api/rooms/:id`
POST `/api/rooms/:id/join`
POST `/api/rooms/:id/leave`
GET `/api/rooms/:id/members`

GET `/api/rooms/:id/messages?before=<messageId>&limit=30`
POST `/api/rooms/:id/messages`
PATCH `/api/rooms/:id/messages/:messageId`
DELETE `/api/rooms/:id/messages/:messageId`

## Socket events
Client -> server:
- `join-room`
- `leave-room`
- `send-message`
- `typing`
- `stop-typing`
- `mark-read`

Server -> client:
- `new-message`
- `user-online`
- `user-offline`
- `typing`
- `stop-typing`
- `message-read`

## Notes
The server uses a normal Node HTTP server with Socket.IO attached, so it can be deployed to a long-running host such as Render.
