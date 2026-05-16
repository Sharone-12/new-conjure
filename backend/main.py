import sys
print("Python version:", sys.version, flush=True)
print("Starting Conjure API...", flush=True)

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    from database import Base, engine
    from routes.auth import router as auth_router
    from routes.notes import router as notes_router
    from routes.dashboard import router as dashboard_router

    app = FastAPI(title="Conjure API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(notes_router, prefix="/notes", tags=["notes"])
    app.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])

    @app.on_event("startup")
    def startup():
        Base.metadata.create_all(bind=engine)

    @app.get("/")
    def root():
        return {"status": "Conjure API running"}

    print("Conjure API initialized successfully.", flush=True)

except Exception as e:
    import traceback
    print("STARTUP ERROR:", e, flush=True)
    traceback.print_exc()
    raise
