# Simulasi Random Forest - Prediksi Pembelian Battle Pass

Nama: Syifa Kanita Putri G
Kelas: 5C
NIM:301240016

Tugas Metode 2 Tesis (Algoritma Random Forest), Magister Teknik Informatika.
Studi kasus: memprediksi apakah seorang pemain game membeli Battle Pass musim ini.


## Dataset
14 pemain, 4 atribut (Rank, JamMain, MainTim, EventDiskon) dan label BeliBP (Ya/Tidak). Lihat `dataset.csv`.

## Isi project
| File | Keterangan |
|---|---|
| `dataset.csv` | Data 14 pemain |
| `perhitungan-manual.xlsx` | Perhitungan manual: Entropy, Gain, Split Info, Gain Ratio, 3 pohon, OOB, prediksi |
| `web/` | Web simulasi (HTML, CSS, JavaScript) |
| `app.py` | Menjalankan web secara lokal |

## Cara menjalankan di komputer
```
python app.py
```
Lalu buka http://localhost:8000 (otomatis terbuka). Tidak perlu install library apa pun.

## Metode
- Bootstrap sampling (n = 14, dengan pengembalian)
- Fitur acak per node: m = akar(4) = 2
- Kriteria pemisah: Gain Ratio (Entropy, Gain, Split Info)
- Evaluasi: Out-of-Bag (OOB)
- Prediksi: vote mayoritas
- Aturan seri: Gain Ratio sama -> fitur yang urutannya lebih dulu; vote seri -> Ya

Web punya dua mode: **Skenario laporan** (3 pohon, sama dengan Excel) dan **Acak baru** (bootstrap dan fitur acak sesuai seed).