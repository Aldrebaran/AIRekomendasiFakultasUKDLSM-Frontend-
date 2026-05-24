import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Header = ({ onAdminClick, isAdminLoggedIn, onLogout }) => (
  <header className="bg-[#109060] text-white px-6 py-4 flex justify-between items-center shadow-md fixed top-0 left-0 w-full h-20 z-50">
    <div className="flex items-center gap-4">
      <img 
        src="/Logo.png" 
        alt="Logo DLSM" 
        className="w-12 h-12 object-contain bg-[#109060]" 
      />
      <h1 className="text-lg md:text-2xl font-black uppercase tracking-wider text-amber-300">
        Rekomendasi Fakultas
      </h1>
    </div>
    
    <div className="shrink-0">
      {isAdminLoggedIn ? (
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-600 text-red-200 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm active:scale-95 border border-red-500/30 backdrop-blur-sm"
        >
          Logout Admin
        </button>
      ) : (
        <button
          onClick={onAdminClick}
          className="px-4 py-2 bg-amber-400/10 hover:bg-amber-400 text-amber-300 hover:text-green-950 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm active:scale-95 border border-amber-400/40 backdrop-blur-sm"
        >
          Login Admin
        </button>
      )}
    </div>
  </header>
);

const InputArea = ({ input, setInput, sendMessage, isLoading }) => (
  <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
    <div className="max-w-5xl mx-auto flex items-center gap-2 border border-gray-300 rounded-full p-1 bg-gray-50 focus-within:border-[#109060] focus-within:ring-2 focus-within:ring-[#109060]/20 transition-all duration-300">
      <textarea 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        placeholder="Ceritakan minat, bakat, atau bidang yang kamu sukai..."
        rows={1}
        className="flex-1 bg-transparent px-4 py-2 text-gray-700 focus:outline-none placeholder:text-gray-400 resize-none overflow-y-auto max-h-32 min-h-10 wrap-break-words whitespace-pre-wrap"
        disabled={isLoading}
      />
      <button 
        onClick={sendMessage}
        disabled={isLoading || !input.trim()}
        className={`p-3 rounded-full transition-all duration-300 ${
          isLoading || !input.trim() 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-[#109060] hover:bg-[#0c704a] active:scale-95 shadow-md'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  </div>
);

const RecommendationCard = ({ number, title, percentage, description, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 flex gap-6 shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group">
    <div className={`absolute top-0 left-0 h-full w-1.5 ${color}`}></div>
    
    <div className={`shrink-0 w-16 h-16 rounded-full ${color} text-white flex items-center justify-center text-4xl font-black shadow-inner`}>
      {number}
    </div>
    
    <div className="flex-1">
      <h3 className="text-2xl font-bold text-gray-800 mb-1 group-hover:text-[#109060] transition-colors">{title}</h3>
      
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-5xl font-black text-amber-500">{percentage}%</span>
        <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Kecocokan</span>
      </div>
      
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

function App() {
  const [input, setInput] = useState('');
  const [stage, setStage] = useState('welcome'); 
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const chatEndRef = useRef(null);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAdminRegister, setIsAdminRegister] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  });
  
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminInviteCode, setAdminInviteCode] = useState('');
  const [modalError, setModalError] = useState('');

  const [dataset, setDataset] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState('Fakultas Teknik');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [recommendations, stage]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setStage('welcome');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/chat`, { 
        message: input 
      });
      
      if (response.data.recommendations) {
        setRecommendations(response.data.recommendations);
      } else {
        setRecommendations([
          { number: 1, title: 'Teknik Informatika', percentage: 92, color: 'bg-amber-400', description: 'Anda memiliki minat tinggi dalam teknologi, analisis data, dan problem solving. Fakultas ini sangat sesuai dengan profil Anda.' },
          { number: 2, title: 'PGSD', percentage: 83, color: 'bg-gray-400', description: 'Anda memiliki kombinasi kuat antara logika, kreativitas, dan kepedulian sosial.' },
          { number: 3, title: 'Hukum', percentage: 54, color: 'bg-[#a3a3a3]', description: 'Pilihan ini didasarkan pada potensi analitis Anda.' },
        ]);
      }
      
      setInput('');
      setTimeout(() => {
        setStage('results');
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      alert('Waduh, koneksi ke server gagal!');
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (isAdminRegister) {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/register`, {
          email: adminEmail,
          password: adminPassword,
          invitation_code: adminInviteCode
        });
        if (res.data.status === 'success') {
          alert(res.data.message);
          setIsAdminRegister(false); 
          setAdminInviteCode('');
        }
      } catch (err) {
        setModalError(err.response?.data?.detail || 'Gagal mendaftar admin baru.');
      }
    } else {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/login`, {
          email: adminEmail,
          password: adminPassword
        });
        if (res.data.status === 'success') {
          localStorage.setItem('isAdminLoggedIn', 'true');
          setIsAdminLoggedIn(true);
          setShowAdminModal(false);
          setAdminEmail('');
          setAdminPassword('');
          alert('Selamat Datang Admin Unika De La Salle!');
        }
      } catch (err) {
        setModalError(err.response?.data?.detail || 'Email atau password salah.');
      }
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    alert('Berhasil logout dari sistem admin.');
    localStorage.removeItem('isAdminLoggedIn');
  };

  const fetchDataset = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/dataset`);
      setDataset(res.data);
    } catch (err) {
      console.error("Gagal mengambil dataset:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadAdminData = async () => {
      if (isAdminLoggedIn && isMounted) {
        await fetchDataset();
      }
    };

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [isAdminLoggedIn]);

  const handleAddWord = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/dataset`, {
        word: newWord,
        category: newCategory
      });
      if (res.data.status === 'success') {
        alert(res.data.message);
        setNewWord('');
        setShowAddModal(false);
        fetchDataset();
        setCurrentPage(1); 
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal menambahkan kata baru.');
    }
  };

  const handleDeleteWord = async (word, category) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus kata '${word}' dari ${category}?`)) {
      try {
        const res = await axios.delete(`${import.meta.env.VITE_API_URL}/admin/dataset/${word}/${category}`);
        if (res.data.status === 'success') {
          fetchDataset(); 

          if (currentDataset.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
      }} catch (err) {
        alert(err.response?.data?.detail || 'Gagal menghapus kata.');
      }
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState('Semua Fakultas');

  const filteredDataset = dataset.filter((item) => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaculty = selectedFacultyFilter === 'Semua Fakultas' || item.category === selectedFacultyFilter;
    return matchesSearch && matchesFaculty;
  });

  const itemsPerPage = 10; 
  
  const totalPages = Math.ceil(filteredDataset.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  const currentDataset = filteredDataset.slice(indexOfFirstItem, indexOfLastItem); 

  const getDescription = (facultyName, score, index) => {
  const templates = {
    ranking1High: [
      `Berdasarkan analisis minat, Anda memiliki kecocokan yang sangat kuat di ${facultyName}. Kurikulum dan fokus pembelajaran di bidang ini dirancang khusus untuk mengasah potensi terbaik Anda secara maksimal.`,
      `Hasil evaluasi menunjukkan bahwa ${facultyName} adalah wadah paling ideal untuk bakat Anda. Memilih rumpun ini akan mempercepat akselerasi keahlian strategis yang sudah Anda miliki.`,
      `Cerita minat Anda selaras sempurna dengan kompetensi utama di ${facultyName}. Industri ini membutuhkan profil pemikir kritis dan dinamis seperti Anda untuk berkembang.`
    ],
    ranking1Low: [
      `Berdasarkan cerita Anda, ${facultyName} menjadi rekomendasi teratas yang paling mendekati preferensi Anda saat ini. Mengeksplorasi bidang ini akan membantu mengasah potensi tersembunyi yang Anda miliki.`,
      `Meskipun narasi minat Anda masih bersifat umum, karakteristik Anda paling condong mengarah ke ${facultyName}. Ini adalah titik awal yang baik untuk mulai memfokuskan karir akademik Anda.`,
      `AI mendeteksi fondasi ketertarikan Anda paling dominan berada di ruang lingkup ${facultyName}. Bidang ini menawarkan peta jalan studi yang adaptif untuk menjajaki minat baru Anda.`
    ],
    mediumScore: [
      `Pilihan di ${facultyName} juga menunjukkan keselarasan yang cukup baik dengan beberapa poin cerita Anda. Bidang ini bisa menjadi alternatif karir yang solid untuk memperluas cakrawala keahlian Anda.`,
      `Disiplin ilmu di ${facultyName} memiliki irisan menarik dengan minat yang Anda sebutkan. Mengombinasikan aspek ini akan membuat profil keahlian Anda menjadi lebih unik di dunia kerja.`
    ],
    lowScore: [
      `Aspek di ${facultyName} memiliki keterkaitan minor dengan cerita Anda. Bidang ini bisa menjadi wawasan pelengkap yang berguna untuk mendukung kompetensi utama Anda di masa depan.`,
      `Rumpun ilmu di ${facultyName} berada pada klaster pendukung. Meskipun bukan prioritas utama, fondasi dasar dari bidang ini tetap bernilai tinggi untuk memperkaya perspektif global Anda.`
    ],
    bottomScore: [
      `Minat yang Anda ceritakan cenderung mengarah ke sektor lain, sehingga ${facultyName} berada di posisi alternatif terbawah untuk eksplorasi studi Anda saat ini.`,
      `Analisis AI menunjukkan kecenderungan yang sangat minim ke arah ${facultyName}. Fokus energi Anda saat ini sebaiknya dialokasikan pada opsi peringkat di atasnya.`
    ]
  };

  const pickRandom = (array) => {
    const stringHash = facultyName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomIndex = (stringHash + score) % array.length;
    return array[randomIndex];
  };
  if (index === 0) {
    return score >= 60 ? pickRandom(templates.ranking1High) : pickRandom(templates.ranking1Low);
  }

  if (score >= 40) return pickRandom(templates.mediumScore);
  if (score >= 10) return pickRandom(templates.lowScore);
  return pickRandom(templates.bottomScore);
};

 return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pt-24 pb-32">
      <Header 
        onAdminClick={() => { 
          setModalError(''); 
          setIsAdminRegister(false); 
          setShowAdminModal(true); 
        }} 
        isAdminLoggedIn={isAdminLoggedIn}
        onLogout={handleLogout}
      />

      <main className="max-w-5xl mx-auto px-4 md:px-6 space-y-12">
        {isAdminLoggedIn ? (
          
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-gray-100 animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
              <div>
                <div className="inline-block px-3 py-1 bg-green-100 text-[#109060] rounded-full text-xs font-bold uppercase mb-2">
                  Mode Administrator Aktif
                </div>
                <h2 className="text-2xl font-black text-gray-800">Manajemen Dataset</h2>
                <p className="text-gray-500 text-xs mt-0.5">Kelola kamus kata kunci untuk rekomendasi 7 fakultas.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#109060] hover:bg-[#0c704a] text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <span className="text-base">+</span> Tambah Kata Baru
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200/60">
              <div className="w-full sm:max-w-xs relative">
                <input
                  type="text"
                  placeholder="Cari kata kunci..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#109060]/30 focus:border-[#109060] transition-all bg-white"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap hidden md:inline">
                  Filter:
                </label>
                <select
                  value={selectedFacultyFilter}
                  onChange={(e) => {
                    setSelectedFacultyFilter(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#109060]/30"
                >
                  <option value="Semua Fakultas">Semua Fakultas (Tampilkan Semua)</option>
                  <option value="Fakultas Teknik">Fakultas Teknik</option>
                  <option value="Fakultas Hukum">Fakultas Hukum</option>
                  <option value="Fakultas Ekonomi dan Bisnis">Fakultas Ekonomi dan Bisnis</option>
                  <option value="Fakultas Keperawatan">Fakultas Keperawatan</option>
                  <option value="Fakultas Pariwisata">Fakultas Pariwisata</option>
                  <option value="Fakultas Ilmu Pendidikan">Fakultas Ilmu Pendidikan</option>
                  <option value="Fakultas Pertanian">Fakultas Pertanian</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
                    <th className="px-6 py-4 text-center border-r border-gray-200 w-20">No</th>
                    <th className="px-6 py-4 text-center border-r border-gray-200">Kata Kunci (Word)</th>
                    <th className="px-6 py-4 text-center border-r border-gray-200">Kategori Fakultas</th>
                    <th className="px-6 py-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody key={`${currentPage}-${searchTerm}-${selectedFacultyFilter}`} className="divide-y divide-gray-100 bg-white text-gray-600 animate-fade-in duration-300">
                  {currentDataset.length > 0 ? (
                    currentDataset.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-3.5 text-center font-medium text-gray-400 border-r border-gray-200">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-6 py-3.5 text-center font-bold text-gray-800 border-r border-gray-200">{item.word}</td>
                        <td className="px-6 py-3.5 text-center border-r border-gray-200">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded border border-gray-200">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button 
                            onClick={() => handleDeleteWord(item.word, item.category)}
                            className="text-red-500 hover:text-red-700 font-bold text-xs hover:underline transition-colors"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">
                        {searchTerm || selectedFacultyFilter !== 'Semua Fakultas' 
                          ? 'Tidak ada kata kunci yang cocok dengan kriteria pencarian/filter Anda.'
                          : 'Belum ada data kata kunci di database MongoDB. Silakan klik tombol Tambah Kata Baru!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredDataset.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 text-sm">
                <div className="text-gray-500 font-medium">
                  Menampilkan <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> sampai{" "}
                  <span className="font-bold text-gray-800">
                    {indexOfLastItem > filteredDataset.length ? filteredDataset.length : indexOfLastItem}
                  </span>{" "}
                  dari <span className="font-bold text-gray-800">{filteredDataset.length}</span> kata kunci 
                  {selectedFacultyFilter !== 'Semua Fakultas' && ` (Filtered)`}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-600 transition-all disabled:opacity-40 disabled:hover:bg-white active:scale-95"
                  >
                    ← Prev
                  </button>
                  
                  <div className="px-4 py-1.5 bg-gray-100 rounded-lg font-bold text-gray-700 border border-gray-200/40">
                    Halaman {currentPage} dari {totalPages}
                  </div>
                  
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-semibold text-gray-600 transition-all disabled:opacity-40 disabled:hover:bg-white active:scale-95"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

        ) : (
          
          <>
            {stage === 'welcome' && (
              <div className="bg-white border border-gray-100 rounded-2xl p-10 flex gap-8 shadow-sm transition-all duration-500 ease-in-out transform scale-100 opacity-100">
                <div className="w-1.5 bg-[#109060] rounded-full shrink-0"></div>
                <div className="flex-1 space-y-5">
                  <h2 className="text-3xl font-extrabold text-[#109060] leading-tight">
                    Halo! Saya AI Konsultasi<br />
                    <span className="text-gray-900">Unika De La Salle Manado</span>
                  </h2>
                  <p className="text-gray-600 leading-relaxed max-w-2xl">
                    Saya di sini untuk membantu Anda menemukan fakultas yang paling sesuai dengan minat, bakat, dan potensi Anda. Silakan ceritakan tentang minat Anda, mata pelajaran favorit, atau aktivitas yang Anda nikmati. Semakin banyak informasi yang Anda berikan, semakin akurat rekomendasi yang bisa saya berikan!
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-3 text-amber-600 font-medium p-4 bg-amber-50 rounded-xl border border-amber-200 animate-pulse">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce delay-225"></div>
                <span>Sedang menganalisis minat Anda... Tunggu sebentar ya!</span>
              </div>
            )}

            {stage === 'results' && recommendations.length > 0 && (
              <div className="space-y-10 transition-all duration-700 ease-out transform translate-y-0 opacity-100">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                    Berdasarkan minat dan profil Anda,<br />
                    <span className="text-[#109060]">berikut adalah rekomendasi fakultas yang paling sesuai:</span>
                  </h2>
                  <p className="text-gray-600">
                    Anda memiliki kombinasi yang kuat antara logika, kreativitas, dan kepedulian sosial. Berikut fakultas yang paling sesuai dengan potensi Anda.
                  </p>
                </div>

                <div className="space-y-6">
                  {recommendations.map((rec, index) => (
                    <RecommendationCard 
                      key={index}
                      number={rec.number}
                      title={rec.title}
                      percentage={rec.percentage} 
                      description={getDescription(rec.title, rec.percentage, index)}
                      color={rec.color}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div ref={chatEndRef} />
      </main>

      {!isAdminLoggedIn && (
        <InputArea 
          input={input} 
          setInput={setInput} 
          sendMessage={sendMessage} 
          isLoading={isLoading} 
        />
      )}

      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative border border-gray-100 transform transition-all scale-100">
            
            <button 
              type="button"
              onClick={() => {
                setShowAdminModal(false);
                setAdminEmail('');
                setAdminPassword('');
                setAdminInviteCode('');
                setModalError('');
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors text-lg"
            >
              ✕
            </button>

            <h2 className="text-2xl font-black text-gray-800 mb-2">
              {isAdminRegister ? 'Daftar Akun Admin' : 'Masuk Sebagai Admin'}
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              {isAdminRegister ? 'Daftarkan email Anda untuk mengelola sistem data.' : 'Gunakan akun De La Salle Anda untuk verifikasi hak akses.'}
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-medium rounded animate-shake">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Email Terdaftar</label>
                <input 
                  type="email" 
                  required
                  placeholder="contoh: admin@unikadelasalle.ac.id"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#109060]/30 focus:border-[#109060] transition-all bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Kata Sandi (Password)</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#109060]/30 focus:border-[#109060] transition-all bg-gray-50"
                />
              </div>

              {isAdminRegister && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Kode Khusus Pendaftaran</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Masukkan kode unik PMB"
                    value={adminInviteCode}
                    onChange={(e) => setAdminInviteCode(e.target.value)}
                    className="w-full px-4 py-2.5 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-amber-50/50 text-amber-900 font-mono"
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="w-full mt-2 py-3 bg-[#109060] hover:bg-[#0c704a] text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-[0.98]"
              >
                {isAdminRegister ? 'Daftar Sekarang' : 'Masuk Ke Dashboard'}
              </button>
            </form>

            <p className="text-xs text-center mt-6 text-gray-500">
              {isAdminRegister ? 'Sudah punya akses administrator?' : 'Petugas PMB baru tapi belum punya akun?'}{" "}
              <button 
                type="button"
                onClick={() => { 
                  setModalError(''); 
                  setIsAdminRegister(!isAdminRegister); 
                  setAdminEmail(''); 
                  setAdminPassword('');
                }}
                className="text-[#109060] hover:underline font-bold transition-all ml-1"
              >
                {isAdminRegister ? 'Login di sini' : 'Daftar akun baru'}
              </button>
            </p>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative border border-gray-100">
            <button 
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors text-lg"
            >
              ✕
            </button>

            <h2 className="text-2xl font-black text-gray-800 mb-1">Tambah Kata Kunci</h2>
            <p className="text-xs text-gray-500 mb-6">Masukkan kata kunci baru ke database PMB De La Salle.</p>

            <form onSubmit={handleAddWord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Kata Kunci (Word)</label>
                <input 
                  type="text" 
                  required
                  placeholder="contoh: koding, perawat, hotel, hukum"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#109060]/30 focus:border-[#109060] transition-all bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Kategori Fakultas</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#109060]/30 focus:border-[#109060] transition-all bg-gray-50 font-medium text-gray-700"
                >
                  <option value="Fakultas Teknik">Fakultas Teknik</option>
                  <option value="Fakultas Hukum">Fakultas Hukum</option>
                  <option value="Fakultas Ekonomi dan Bisnis">Fakultas Ekonomi dan Bisnis</option>
                  <option value="Fakultas Keperawatan">Fakultas Keperawatan</option>
                  <option value="Fakultas Pariwisata">Fakultas Pariwisata</option>
                  <option value="Fakultas Ilmu Pendidikan">Fakultas Ilmu Pendidikan</option>
                  <option value="Fakultas Pertanian">Fakultas Pertanian</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full mt-2 py-3 bg-[#109060] hover:bg-[#0c704a] text-white rounded-lg font-bold text-sm shadow-md transition-all active:scale-[0.98]"
              >
                Simpan ke Database
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;