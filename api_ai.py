from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pymongo
import pandas as pd
import math
import re
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
import admin  
import os
from dotenv import load_dotenv

load_dotenv()  

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uri = os.getenv("MONGODB_URI")
stemmer = StemmerFactory().create_stemmer()

client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
db = client["RekomFakultas"]

app.state.db = db

app.include_router(admin.router)

STOPWORDS = {
    'saya', 'anda', 'kamu', 'dia', 'kita', 'mereka', 'ini', 'itu', 'sini', 'situ', 'sana',
    'di', 'ke', 'dari', 'pada', 'dalam', 'atas', 'bawah', 'antara', 'oleh', 'kepada', 'seperti',
    'dan', 'atau', 'yang', 'untuk', 'dengan', 'tapi', 'namun', 'melainkan', 'sedangkan', 'sambil',
    'karena', 'sebab', 'sehingga', 'maka', 'kemudian', 'lalu', 'setelah', 'sebelum', 'ketika',
    'sangat', 'sekali', 'amat', 'paling', 'banyak', 'sedikit', 'cukup', 'kurang', 'lebih',
    'agak', 'hanya', 'saja', 'juga', 'pun', 'pasti', 'tentu', 'tentang', 'terhadap',
    'apa', 'mengapa', 'bagaimana', 'kapan', 'dimana', 'siapa', 'kah', 'lah', 'tah', 'oh',
    'ada', 'adalah', 'yaitu', 'yakni', 'bisa', 'dapat', 'ingin', 'mau', 'akan', 'harus', 'perlu',
    'boleh', 'jadi', 'menjadi', 'mempunyai', 'memiliki', 'tahu', 'melihat', 'buat', 'bikin', 'tetap',
    'sudah', 'telah', 'belum', 'tidak', 'bukan', 'jangan', 'mungkin', 'mampu', 'luar', 'biasa',
    'hal', 'secara', 'bagi', 'mengenai', 'suatu', 'serta', 'bahwa', 'tersebut', 'terkait', 'bagus',
    'besar', 'kecil', 'era', 'sekarang', 'sisi', 'mempelajari', 'belajar', 'membimbing',
    'ajar', 'bimbing', 'tenteram', 'kondisi', 'masalah', 'tujuan', 'cita', 'tanya'
}

def ambil_data():
    try:
        data_mongo = list(db["Dataset"].find({}, {"_id": 0}))
        
        if not data_mongo:
            print("Peringatan: Data di MongoDB kosong!")
            return pd.DataFrame()

        df = pd.DataFrame(data_mongo)
        df.columns = [c.lower().strip() for c in df.columns]
        
        if 'word' in df.columns and 'category' in df.columns:
            df['word'] = df['word'].astype(str).str.lower().str.strip()
            df['category'] = df['category'].astype(str).str.strip()
            return df
        else:
            print("Error: Kolom 'word' atau 'category' tidak ditemukan di dataset MongoDB!")
            return pd.DataFrame()
            
    except Exception as e:
        print(f"Error Mengambil Data MongoDB: {e}")
        return pd.DataFrame()

def preprocessing(teks):
    teks = teks.lower()
    teks = re.sub(r'[^\w\s]', '', teks) 
    
    kata_awal = [kata for kata in teks.split() if kata not in STOPWORDS]
    teks_filter_1 = " ".join(kata_awal)
    teks_stemmed = stemmer.stem(teks_filter_1)    
    
    kata_bersih = [kata for kata in teks_stemmed.split() if kata not in STOPWORDS]
    return " ".join(kata_bersih)

class UserInput(BaseModel):
    message: str

@app.post("/chat") 
async def get_recommendation(data: UserInput):
    df = ambil_data()
    if df.empty: 
        return {"error": "Database kosong atau koneksi ke MongoDB bermasalah"}

    kata_input = preprocessing(data.message).split()
    daftar_fakultas = df['category'].unique()
    
    vocab_size = max(len(df['word'].unique()), 1)
    skor_log = {}

    for fakultas in daftar_fakultas:
        data_f = df[df['category'] == fakultas]
        
        if len(df) == 0 or len(data_f) == 0:
            prior = math.log(1 / (len(daftar_fakultas) if len(daftar_fakultas) > 0 else 1))
        else:
            prior = math.log(len(data_f) / len(df))
            
        likelihood = 0.0
        for kata in kata_input:
            match_count = len(data_f[data_f['word'] == kata])
            pembagi = len(data_f) + vocab_size
            if pembagi == 0:
                pembagi = 1
                
            likelihood += math.log((match_count + 1) / pembagi)
        
        total_skor_fakultas = prior + likelihood
        
        if math.isnan(total_skor_fakultas) or math.isinf(total_skor_fakultas):
            skor_log[fakultas] = -9999.0  
        else:
            skor_log[fakultas] = total_skor_fakultas

    if not skor_log:
        return {"error": "Gagal menghitung skor algoritma"}

    max_skor = max(skor_log.values())
    exp_skor = {}
    for fak, skor in skor_log.items():
        try:
            selisih = skor - max_skor
            exp_skor[fak] = math.exp(selisih) if selisih > -700 else 0.0
        except OverflowError:
            exp_skor[fak] = 0.0
            
    total_skor = sum(exp_skor.values())
    hasil_sorted = sorted(exp_skor.items(), key=lambda x: x[1], reverse=True)[:3]
    colors = ["bg-amber-400", "bg-gray-400", "bg-[#a3a3a3]"]
    
    final_recommendations = []
    for i, (fak, prob) in enumerate(hasil_sorted):
        if total_skor > 0:
            percent = round((prob / total_skor) * 100)
        else:
            percent = 0
        
        desc = f"Berdasarkan analisis minat, Anda memiliki kecocokan yang sangat kuat di {fak}. Kurikulum dan fokus pembelajaran di bidang ini dirancang khusus untuk mengasah potensi terbaik Anda."
        
        final_recommendations.append({
            "number": i + 1,
            "title": fak,
            "percentage": percent,
            "color": colors[i],
            "description": desc
        })

    return {
        "reply": f"Analisis selesai untuk minat Anda.",
        "recommendations": final_recommendations
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)