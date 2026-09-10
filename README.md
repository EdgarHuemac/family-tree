# Family Tree

Minimalist web application for building your family tree. The tree is rendered using React Flow (nodes/relationships) with auto-layout via dagre, and all data is stored in a flat JSON file on the server:
`server/data/family-tree.json`. 

This was intended to collaboratively build my own family tree, so the UI is in spanish only for now.

<img width="512" height="320" alt="image" src="https://github.com/user-attachments/assets/31b800a5-465a-451c-850a-d3f6d684bfb0" />

## Structure

```
family-tree-app/
├── server/     # Very lightweight Express API (only reads/writes the JSON)
│   └── data/family-tree.json   ← your family tree lives here
└── client/     # React App (Vite) with React Flow + dagre
```

Dependencias intencionalmente mínimas:
- **server**: `express` only.
- **client**: `react`, `reactflow`, `dagre`, `lucide-react`.

## how to run

You need Node.js 18+ installed. Open two terminals. 
To start the client UI listening over `http://localhost:3001` run on Terminal 1:

```bash
cd server
npm install
npm start
```

Then, to run the Vite backend on `http://localhost:5173`, run on Terminal 2: 

```bash
cd client
npm install
npm run dev
```

The first time the server boots, it automatically creates `server/data/family-tree.json` with a single person named "Me" ("Yo").

Or to serve everything from a single process:
```bash
cd client && npm run build
cd ../server && npm start
```
The Express server automatically serves `client/dist` in addition to the API.

