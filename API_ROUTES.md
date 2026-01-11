# Boocozmo API Routes Documentation

This document lists all backend API endpoints required by the Boocozmo frontend application.
Base URL: `https://boocozmo-api.onrender.com` (or `http://localhost:3000` locally)

## 🔐 Authentication & User
| Method | Endpoint | Description | Payload / Params |
|--------|----------|-------------|------------------|
| POST | `/signup` | Register new user | `{ name, email, password }` |
| POST | `/login` | Login user | `{ email, password }` |
| POST | `/validate-session` | Token validation | Headers: `Authorization: Bearer <token>` |
| GET | `/get-usernames` | Search users | Query: `?query=...` |
| GET | `/profile/:email` | Get public profile | Path: `email` |
| PATCH | `/update-profile` | Update profile | `{ bio, location, profilePhoto }` |

## 📚 Offers (Books)
| Method | Endpoint | Description | Payload / Params |
|--------|----------|-------------|------------------|
| GET | `/offers` | Get all public offers | Query: `limit`, `offset`, `lat`, `lng`, `radius` |
| GET | `/offers/:id` | Get single offer details | Path: `id` |
| GET | `/my-offers` | Get current user's offers | - |
| GET | `/saved-offers` | Get user's saved offers | - |
| GET | `/search-offers` | Search books | Query: `query` |
| POST | `/submit-offer` | Create new offer | `{ type, bookTitle, price?, exchangeBook?, condition, imageUrl, ... }` |
| POST | `/store-offers` | Get offers by IDs | `{ store: { offerIds: [1, 2...] } }` |
| POST | `/close-deal` | Mark as sold/closed | `{ offerId }` |
| POST | `/save-offer` | Bookmark offer | `{ offerId }` |
| POST | `/unsave-offer` | Remove bookmark | `{ offerId }` |
| POST | `/publish-offer/:id` | Make offer public | - |
| POST | `/unpublish-offer/:id`| Make offer private | - |
| DELETE | `/delete-offer/:id` | Delete offer | - |

## 🏪 Stores (My Library)
| Method | Endpoint | Description | Payload / Params |
|--------|----------|-------------|------------------|
| GET | `/stores` | Get user's libraries | Query: `includeOffers=true/false` |
| GET | `/public-stores` | Get all public libraries | - |
| GET | `/stores/:id` | Get specific library | Path: `id` |
| POST | `/create-store` | Create new library | `{ name, description, visibility }` |
| POST | `/add-to-store/:id` | Add books to library | `{ offerIds: [id1, id2...] }` |
| POST | `/remove-from-store/:storeId/:offerId` | Remove book | - |
| PATCH | `/stores/:id/visibility` | Toggle public/private | `{ visibility: "public" | "private" }` |
| PATCH | `/stores/:id/location` | Update map location | `{ latitude, longitude }` |

## 💬 Chat
| Method | Endpoint | Description | Payload / Params |
|--------|----------|-------------|------------------|
| GET | `/chats` | Get all conversations | - |
| GET | `/chats/:chatId` | Get specific chat info | - |
| GET | `/chat-messages/:chatId` | Get message history | Params: `limit`, `offset` |
| GET | `/unread-messages` | Get global unread count | - |
| POST | `/create-chat` | Start new chat | `{ otherUserEmail, offer_id?, title? }` |
| POST | `/send-message` | Send text message | `{ chat_id, content }` |
| POST | `/mark-read` | Mark chat read manually | `{ chatId }` |

## 👥 Community
| Method | Endpoint | Description | Payload / Params |
|--------|----------|-------------|------------------|
| GET | `/communities` | List communities | Query: `category`, `search` |
| GET | `/communities/categories` | List categories | - |
| GET | `/communities/:id` | Public community details | - |
| GET | `/communities/:id/auth` | Member details (is_member) | - |
| POST | `/communities/create` | Create community | `{ title, description, category, is_public }` |
| POST | `/communities/:id/join` | Join community | - |
| POST | `/communities/:id/leave` | Leave community | - |
| POST | `/communities/:id/posts` | Create post | `{ content, image_url, sticker_url }` |
| POST | `/posts/:id/like` | Like/Unlike post | - |
| DELETE | `/posts/:id` | Delete post | - |

## Notes
- All endpoints except public GETs require `Authorization: Bearer <token>` header.
- Images are typically sent as Base64 strings in payloads (check specific endpoints).
