```mermaid
graph TD;
    Client[React Frontend (Vite)] -->|HTTP GET /documents| API[Express API];
    Client -->|HTTP POST /documents (Multipart)| API;
    Client -->|HTTP GET /documents/:id/download (Stream)| API;
    
    subgraph "Backend Server"
    API -->|Read/Write Metadata| DB[(db.json)];
    API -->|Store/Retrieve Files| Storage[Local Disk (uploads/)];
    end

    subgraph "Frontend"
    Client -->|User Interaction| UI[Components: Header, Grid, Modal];
    end
```
