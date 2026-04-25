# Aturan Permainan Kartu "Song" (Game Rules)

Berikut adalah ringkasan seluruh aturan permainan dan mekanik yang telah diimplementasikan di dalam game ini:

## 1. Format & Pembagian Kartu (Dealing)
- **Jumlah Pemain**: 5 Pemain (1 Pemain Manusia & 4 AI Bot).
- **Jumlah Dek**: Menggunakan **2 Dek Kartu Standar** (108 kartu, sudah termasuk 4 Joker standar).
- **Pembagian (Dealing)**: Setiap pemain mendapatkan tepat **20 kartu**.
- **Sisa Kartu**: Terdapat **8 kartu sisa** yang diletakkan tertutup di pojok kiri atas meja. Kedelapan kartu ini akan dibuka (face-up) secara otomatis pada layar peringkat ketika permainan berakhir (Game Over).
- **Animasi**: Kartu dibagikan satu per satu secara realistis dalam keadaan tertutup (delay 140ms per kartu, durasi terbang 600ms).

## 2. Kombinasi Kartu Valid
Pemain hanya bisa menurunkan kartu (membuka/menempel) dengan bentuk kombinasi berikut:
- **Seri Berurutan (Sequence)**: Minimal 3 kartu dengan kembang (*suit*) yang persis sama dan angkanya berurutan. (Contoh: 3-4-5 Hati).
- **Angka Kembar (Same Value Combo / Set)**: Minimal 3 kartu dengan angka yang sama, kembang boleh bebas. (Contoh: 8-8-8).

## 3. Aturan Khusus Kartu As (Ace)
Kartu As memiliki sifat fleksibel namun tidak boleh memutar (*no wrap-around*):
- **Bisa bernilai Rendah (Low)**: Diletakkan sebelum angka 2 (Contoh: `A, 2, 3`).
- **Bisa bernilai Tinggi (High)**: Diletakkan setelah kartu King (Contoh: `Q, K, A`).
- **Aturan Konsistensi**: Di dalam satu Seri/Sequence yang sama, kartu As tidak boleh memiliki 2 peran sekaligus (tidak boleh menyambungkan K ke 2). Contoh `K, A, 2` adalah **TIDAK SAH**.

## 4. Aturan Khusus Kartu Joker
Kartu Joker adalah kartu dewa yang memiliki beberapa fungsi dan aturan mematikan:
- **Wildcard**: Joker (dan khusus **As Sekop / Ace of Spades** yang juga bertindak sebagai Joker) dapat digunakan sebagai pengganti kartu angka maupun kembang apapun untuk membentuk Seri atau Angka Kembar.
- **Mematikan Kartu Kembar (Dead Set)**: Jika ada pemain yang memiliki Angka Kembar (minimal *3-of-a-kind*) di atas meja, lalu ada pemain yang meletakkan **tepat 1 buah Joker** ke dalam kumpulan kartu tersebut, maka kumpulan tersebut dinyatakan **Mati (Dead) dan kartunya akan ditutup (face-down)**. Artinya, tidak ada lagi pemain yang boleh menempelkan kartu tambahan ke kumpulan tersebut hingga akhir permainan.

## 5. Pemblokiran Seri (Sequence Blocking)
Ini adalah aturan kompetitif khas Song untuk menghalangi lawan melanjutkan seri:
- **Terblokir (Blocked)**: Jika di atas meja sudah terdapat Angka Kembar (misal: `Q-Q-Q`), maka tidak ada satupun pemain yang boleh menempelkan **1 kartu tunggal Q** (maupun Joker yang dianggap Q) untuk memperpanjang sebuah seri berurutan (misal memperpanjang seri `9, 10, J`). 
- **Membypass Blokir (Bypass)**: Blokir ini bisa ditembus apabila pemain tersebut langsung menempelkan **2 kartu sekaligus** yang melompati angka yang diblokir tersebut (Misal: menempelkan `Q dan K` secara bersamaan ke `9, 10, J`).

## 6. Penentuan Giliran Setelah Fase Pembukaan (Opening Phase)
Pada awal permainan, setiap pemain wajib menurunkan kombinasi awal mereka (Seri atau Angka Kembar).
- Setelah **semua** pemain selesai meletakkan kombinasi awal mereka, pemain dengan **nilai kartu terendah pada kombinasi awalnya** akan mendapatkan hak untuk jalan duluan pada ronde permainan normal.

## 7. Kondisi Menang & "Song"
- **Song!**: Sebutan saat seorang pemain berhasil menghabiskan seluruh kartu di tangannya (0 kartu).
- **Survivor (Pemain Terakhir)**: Jika semua lawan sudah mengalami *deadlock* (Mati), pemain terakhir yang tersisa tetap diperbolehkan melanjutkan permainannya sendirian (menarik dan membuang kartu) hingga ia juga mengalami *deadlock* atau berhasil melakukan **Song**.
- **Deadlock (Mati)**: Kondisi di mana pemain tidak bisa lagi menurunkan atau menempelkan kartu apapun ke meja. Pemain yang mengalami deadlock dieliminasi dari ronde tersebut.

## 8. Sistem Poin Ronde
Setiap akhir ronde, poin akan dihitung berdasarkan kondisi kartu:

### Poin Kemenangan (Poin Minus):
Jika pemain berhasil melakukan **Song**, mereka mendapatkan bonus poin minus (semakin rendah semakin baik):
- **Song Seri + Joker**: -100 poin (Menghabiskan kartu dengan kombinasi Seri yang mengandung Joker).
- **Song Seri Murni**: -75 poin (Menghabiskan kartu dengan kombinasi Seri tanpa Joker).
- **Song Kembar**: -50 poin (Menghabiskan kartu dengan kombinasi Angka Kembar).
- **Song Tempel (Nempel)**: -25 poin (Menghabiskan kartu terakhir dengan cara menempelkannya ke kombinasi yang sudah ada di meja).
- **Menang Eliminasi**: -50 poin (Menjadi pemain terakhir yang bertahan saat semua lawan sudah mati/deadlock).

### Poin Kekalahan (Poin Plus):
Pemain yang kalah akan dihitung jumlah nilai kartu di tangannya:
- **Nilai Kartu**: Angka 2-10 sesuai nilainya, J/Q/K bernilai 10, As bernilai 11 (kecuali sebagai angka 1), dan Joker bernilai 15.
- **Batas Maksimal (Cap)**: Nilai maksimal yang dihitung per ronde adalah **+50 poin**. Jika total nilai kartu Anda 70, tetap dihitung 50.

## 9. Sistem Pertandingan (Match System)
- **Target Poin**: Pertandingan terdiri dari beberapa ronde dan akan berakhir jika ada salah satu pemain (Player atau Bot) yang menyentuh atau melewati **500 poin**.
- **Penentuan Juara**: Saat ada yang mencapai 500 poin, seluruh pemain akan diurutkan berdasarkan total poin terendah. Pemain dengan total poin paling kecil adalah Juara Pertandingan.

## 10. Fitur Bantuan (Hint System)
- **Tombol Hint**: Pemain dapat menekan tombol 💡 Hint untuk melihat apakah ada kombinasi yang bisa dimainkan.
- **Visual Clue**: Kartu yang bisa dimainkan akan **bercahaya emas (glowing gold)** dan sistem akan memberikan pesan petunjuk di layar.
