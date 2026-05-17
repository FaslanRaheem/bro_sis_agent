from fastapi import FastAPI

from app.api.v1.endpoints import auth, leaves, complaints, google_auth, user
from app.db.session import Base, engine


Base.metadata.create_all(bind=engine)



app = FastAPI(title="HR AI System Backend")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "API is running! Visit /docs for the Swagger UI."}

app.include_router(auth.router)
app.include_router(leaves.router)
app.include_router(complaints.router)
app.include_router(google_auth.router)
app.include_router(user.router)
