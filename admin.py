from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/admin", tags=["Admin"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    invitation_code: str

class LoginRequest(BaseModel):
    email: str
    password: str

# Model baru untuk input Tambah Kata Kunci
class DatasetItem(BaseModel):
    word: str
    category: str


@router.post("/register")
def admin_register(req: RegisterRequest, request: Request):
    db = request.app.state.db
    
    if req.invitation_code != "DELASALLEPMB":
        raise HTTPException(status_code=400, detail="Kode khusus undangan salah!")
    
    existing_admin = db["Admin"].find_one({"email": req.email})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Email tersebut sudah terdaftar sebagai admin.")
    
    new_admin = {
        "email": req.email,
        "password": req.password 
    }
    db["Admin"].insert_one(new_admin)
    
    return {"status": "success", "message": "Akun administrator Unika De La Salle berhasil didaftarkan!"}


@router.post("/login")
def admin_login(req: LoginRequest, request: Request):
    db = request.app.state.db
    
    admin_user = db["Admin"].find_one({"email": req.email})
    
    if not admin_user or admin_user["password"] != req.password:
        raise HTTPException(status_code=400, detail="Email atau password salah.")
        
    return {"status": "success", "message": "Selamat datang kembali Admin!"}



@router.get("/dataset")
def get_dataset(request: Request):
    db = request.app.state.db
    items = list(db["Dataset"].find({}, {"_id": 0}))
    return items

@router.post("/dataset")
def add_dataset_item(item: DatasetItem, request: Request):
    db = request.app.state.db
    
    clean_word = item.word.lower().strip()
    clean_category = item.category.strip()
    
    if not clean_word or not clean_category:
        raise HTTPException(status_code=400, detail="Kata kunci dan kategori tidak boleh kosong.")
    
    existing_item = db["Dataset"].find_one({"word": clean_word, "category": clean_category})
    if existing_item:
        raise HTTPException(status_code=400, detail="Kata kunci dengan kategori ini sudah ada di database.")
        
    db["Dataset"].insert_one({
        "word": clean_word,
        "category": clean_category
    })
    return {"status": "success", "message": f"Kata '{clean_word}' berhasil ditambahkan ke {clean_category}!"}

@router.delete("/dataset/{word}/{category}")
def delete_dataset_item(word: str, category: str, request: Request):
    db = request.app.state.db
    
    result = db["Dataset"].delete_one({"word": word.lower().strip(), "category": category.strip()})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kata kunci tidak ditemukan.")
        
    return {"status": "success", "message": f"Kata '{word}' berhasil dihapus!"}