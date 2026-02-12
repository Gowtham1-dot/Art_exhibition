
ARTT — The Grand Canvas
ARTT is a full‑stack web gallery where artists upload artwork and an AI curator generates exhibition themes. A curator reviews/edit drafts and publishes exhibitions to the public gallery.

What’s included
Public gallery: browse published exhibitions + approved artworks
Artwork upload: image + metadata (tags/style/medium/colors)
Cloudinary storage: original + thumbnail
AI curation (Gemini):
analyzes artwork metadata (stored on the artwork)
generates 2–3 exhibition suggestions (stored as AISuggestion)
Curator dashboard (PIN + JWT):
generate AI suggestions
review/edit draft exhibitions (title/description + reorder/remove artworks + replace images)
publish/unpublish exhibitions
delete suggestions (draft-safe) and delete artworks (curator only)
Tech stack
Frontend: Next.js (App Router) + React
Backend: Node.js + Express
Database: MongoDB (Mongoose)
Media: Cloudinary (image + thumbnail)
AI: Google Gemini (with fallback handling)
Repo structure
frontend/ — Next.js UI
backend/ — Express API
Run locally
Prereqs
Node.js 18+ (recommended)
MongoDB (local or Atlas)
Cloudinary account (for image storage)
Gemini API key (Google AI Studio)
1) Backend setup
Create backend/.env (the backend also supports a repo‑root .env, but backend/.env is recommended):

# server
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/artt

# curator auth
CURATOR_PIN=1234
CURATOR_JWT_SECRET=dev-secret-change-me

# cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# gemini
GEMINI_API_KEY=...
# optional
# GEMINI_MODEL=gemini-2.5-flash
# AI_FALLBACK_MODE=heuristic
# ALLOW_AI_HEALTH=true
Start the backend:

cd backend
npm install
npm run dev
Backend runs at: http://localhost:5000

2) Frontend setup
Create frontend/.env.local:

NEXT_PUBLIC_API_URL=http://localhost:5000/api
Start the frontend:

cd frontend
npm install
npm run dev
Open: http://localhost:3000

How to use
Upload flow
Open /upload
Upload an artwork + metadata
Artwork is saved as pending until a curator approves it
Curator flow
Open /curator
Login using CURATOR_PIN
Approve uploaded artworks (so they can be used publicly and for AI grouping)
Click Generate to create AI suggestions
For any suggestion, click Review / Edit to open the inline draft editor
Publish the exhibition when it looks correct
API overview (key routes)
Public:

GET /api/artworks — list approved artworks
GET /api/exhibitions — list published exhibitions
GET /api/exhibitions/:id — get a published exhibition
POST /api/artworks — upload a new artwork (creates a pending artwork)
Curator:

POST /api/curator/auth/pin — login and get JWT
GET /api/curator/artworks?status=pending|approved — list artworks
POST /api/curator/artworks/:id/approve — approve artwork
DELETE /api/curator/artworks/:id — delete artwork (curator only)
GET /api/curator/ai-suggestions — list AI suggestions
POST /api/exhibitions/generate — generate AI suggestions
POST /api/curator/ai-suggestions/:id/approve — create draft exhibition
PUT /api/curator/exhibitions/:id — edit draft (title/statement + reorder/remove)
POST /api/curator/exhibitions/:id/artworks/:artworkId/image — replace an artwork image inside a draft
POST /api/curator/exhibitions/publish — publish exhibition
POST /api/curator/exhibitions/:id/unpublish — unpublish exhibition
Troubleshooting
AI generation fails / quota exceeded: try later or set AI_FALLBACK_MODE=heuristic to generate non-AI fallback exhibitions.
Curator login fails: ensure CURATOR_PIN and CURATOR_JWT_SECRET exist in backend/.env.
Images not showing: verify Cloudinary env vars and that thumbnailUrl/imageUrl are present in MongoDB.
Notes
SVG upload support is not explicitly validated; this project is primarily tested with common image formats.
Public deletion is intentionally disabled — artwork deletion is curator-only.
