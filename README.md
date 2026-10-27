# AwenDEV — Portfolio & Technical Notes

<div align="center">

[![Website](https://img.shields.io/badge/Live_Site-awendev.online-111316?style=for-the-badge&logo=googlechrome&logoColor=white)](https://awendev.online/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/awen-dml/itsupport-webdev-portfolio)
[![Tech Stack](https://img.shields.io/badge/Stack-Vanilla_HTML_•_CSS_•_JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](#-teknologi--arsitektur)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#-lisensi)

<p align="center">
  <strong>Website Portofolio Profesional & Technical Notes</strong> yang menggabungkan dua disiplin keahlian:<br>
  <strong>Web Development (PHP/Laravel/Modern JS)</strong> &amp; <strong>IT Support &amp; Operasional Infrastruktur</strong>.
</p>

[Jelajahi Portofolio](https://awendev.online/) • [Baca Technical Notes](https://awendev.online/blog/) • [Hubungi Pengembang](https://wa.me/6282293896513)

---

</div>

## 📌 Ringkasan Proyek

Repositori ini berisi kode sumber untuk website portofolio resmi **AwenDEV** ([awendev.online](https://awendev.online/)). Dirancang dengan estetika *luxury editorial* modern, website ini menyajikan perjalanan karier, proyek rekayasa perangkat lunak, studi kasus penanganan infrastruktur IT di lingkungan industri nyata, serta dokumentasi teknis troubleshooting (*technical notes*).

Dibangun secara murni (**Zero-Framework / Vanilla**) tanpa ketergantungan *library* pihak ketiga yang berat untuk mencapai waktu muat instan (*blazing fast load*), skor performa tinggi, dan aksesibilitas optimal.

---

## ✨ Fitur Utama

- 🎨 **Editorial Layout & Design System**
  - Desain editorial elegan dengan *vertical gridlines*, hierarki tipografi premium (*Playfair Display*, *Inter*, dan *JetBrains Mono*).
  - Tampilan responsif di semua perangkat (*desktop*, tablet, dan ponsel pintar).
- 🌗 **Light & Dark Theme Switcher**
  - Dilengkapi pendeteksi preferensi sistem dan penyimpanan status tema via `localStorage`.
  - Transisi warna yang halus menggunakan variabel CSS (*CSS Custom Properties*).
- 🎬 **Canvas Scroll-Driven 3D Frame Animation**
  - Animasi visual berbasis *scroll scrubbing* interaktif pada hero section menggunakan HTML5 Canvas API (40 rangkaian *frame* gambar) yang dioptimasi dengan caching memori dan throttle *requestAnimationFrame*.
- ⚡ **Zero-Framework & Ultra Ringan**
  - Tidak memerlukan proses *bundling* (*webpack*, *vite*, atau *npm build*). Kode HTML, CSS, dan JavaScript murni langsung dieksekusi di *browser*.
- 📝 **Technical Notes & Real-world Case Studies**
  - Modul blog independen berisi artikel pemecahan masalah teknis nyata (Windows SMB Server, NComputing L300 Thin Client, Printer Spooler & Network, serta refleksi transisi karier IT).
- ♿ **Aksesibilitas & SEO Friendly**
  - Struktur HTML semantik, atribut ARIA, *skip-link navigation*, serta metadata Open Graph & Twitter Card lengkap.

---

## 🛠️ Teknologi & Arsitektur

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Markup** | HTML5 Semantik | Struktur bersih, SEO-ready, dan ramah pembaca layar (*screen reader*). |
| **Styling** | Vanilla CSS3 | *CSS Variables (Themes)*, *CSS Grid*, *Flexbox*, dan *editorial animations*. |
| **Interaktivitas** | Vanilla JavaScript (ES6+) | Manajemen tema, *preloader*, navigasi *mobile*, dan *IntersectionObserver*. |
| **Grafis & Animasi**| HTML5 Canvas API | Render sekuens frame gambar (40 frames) untuk visual 3D interaktif. |
| **Tipografi** | Google Fonts | *Inter*, *JetBrains Mono*, *Playfair Display*. |
| **Hosting & DNS** | Cloudflare / GitHub Pages | Dilengkapi konfigurasi `CNAME` untuk kustom domain `awendev.online`. |

---

## 📂 Struktur Direktori

```text
itsupport-webdev-portfolio/
├── CNAME                         # Konfigurasi custom domain (awendev.online)
├── index.html                    # Halaman utama portofolio
├── assets/
│   ├── css/
│   │   └── style.css             # Stylesheet utama & variabel tema (dark/light)
│   ├── frames/                   # Rangkaian gambar frame (frame_001.png s/d frame_040.png)
│   │   ├── frame_001.png
│   │   └── ...                   # Frame aset untuk hero 3D canvas animation
│   ├── img/                      # Aset gambar proyek & media portofolio
│   │   ├── awen.ico              # Favicon
│   │   ├── awen.png              # Foto avatar / logo
│   │   ├── awenvault.PNG         # Preview proyek AwenVault
│   │   ├── lambu.PNG             # Preview proyek Lambu Fullstack
│   │   ├── ruangusaha.PNG        # Preview proyek Ruang Usaha
│   │   ├── rahmatportfo.PNG      # Preview proyek Web Portfolio
│   │   └── og-cover.jpg          # Cover banner untuk Open Graph & social share
│   └── js/
│       └── script.js             # Skrip interaksi, Canvas frame engine, & preloader
└── blog/                         # Technical Notes & Catatan Troubleshooting
    ├── index.html                # Arsip daftar artikel
    ├── laravel-programmer-ke-it-support.html
    ├── ncomputing-l300-troubleshooting.html
    ├── printer-troubleshooting.html
    └── windows-file-server-smb.html
```

---

## 🚀 Menjalankan Secara Lokal (Local Development)

Proyek ini tidak memerlukan instalasi dependensi (`npm install`) atau build tool tambahan. Anda cukup menjalankan web server statis:

### Opsi 1: VS Code Live Server (Direkomendasikan)
1. Buka folder proyek di **Visual Studio Code**.
2. Pasang ekstensi **Live Server**.
3. Klik kanan pada file `index.html` dan pilih **"Open with Live Server"**.

### Opsi 2: Python HTTP Server
Jika Anda memiliki Python terpasang di komputer:
```bash
# Masuk ke direktori proyek
cd itsupport-webdev-portfolio

# Jalankan server lokal di port 8000
python -m http.server 8000
```
Buka browser dan akses: `http://localhost:8000/`

### Opsi 3: Node.js (via `npx serve`)
```bash
# Jalankan server statis instan
npx serve .
```

---

## 💼 Proyek & Kasus yang Ditampilkan

### 💻 Web Development Showcase
1. **AwenVault — Personal Archive & Repository**
   - Repositori pengetahuan berbasis web yang terintegrasi dengan Supabase & Cloudflare.
   - [Live Demo](https://awenvault.surge.sh)
2. **Lambu Fullstack Application**
   - Arsitektur web modern dengan Laravel (backend API) dan Next.js (frontend).
   - [GitHub Repo](https://github.com/awen-dml/lambu-frontend)
3. **Ruang Usaha Landing Page**
   - Halaman promosi komersial responsif dengan performa cepat.
   - [Live Demo](https://ruangusaha.online)
4. **Developer Portfolio**
   - Portofolio personal dengan antarmuka dinamis dan interaktif.
   - [Live Demo](https://rahmathidayatdev.netlify.app/)

### 🛠️ Studi Kasus IT Support Operasional
- **Windows Server / SMB**: Investigasi kendala konkurensi koneksi file server dan analisis sesi SMB jaringan lokal.
- **Thin Client NComputing L300**: Pemulihan masalah layar hitam (*black screen*), *session drop*, dan konektivitas terminal server.
- **Hardware & Printer Spooler**: Solusi penanganan antrean cetak macet, driver mismatch, serta konfigurasi printer jaringan bersama.

---

## 📬 Kontak & Profil

- **Pengembang:** Awen (Web Developer & IT Support Specialist)
- **Lokasi:** Kendari, Sulawesi Tenggara, Indonesia
- **Website:** [awendev.online](https://awendev.online)
- **Email:** [awendml@gmail.com](mailto:awendml@gmail.com)
- **WhatsApp:** [+62 822-9389-6513](https://wa.me/6282293896513)
- **GitHub:** [@awen-dml](https://github.com/awen-dml)

---

## 📄 Lisensi

Kode sumber ini dirilis di bawah lisensi [MIT License](LICENSE). Anda bebas menggunakannya sebagai inspirasi atau referensi untuk portofolio pribadi Anda dengan tetap menyertakan atribusi yang sesuai.
