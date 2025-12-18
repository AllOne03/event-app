-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 17 Des 2025 pada 17.20
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_event_management`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `slug` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `categories`
--

INSERT INTO `categories` (`category_id`, `name`, `slug`) VALUES
(1, 'Teknologi', 'teknologi'),
(2, 'Musik & Hiburan', 'musik'),
(3, 'Bisnis & Karir', 'bisnis'),
(4, 'Kesehatan', 'kesehatan');

-- --------------------------------------------------------

--
-- Struktur dari tabel `events`
--

CREATE TABLE `events` (
  `event_id` int(11) NOT NULL,
  `organizer_id` int(11) NOT NULL,
  `venue_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `banner_image` varchar(255) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('draft','published','ended','cancelled') DEFAULT 'draft',
  `created_at` datetime DEFAULT current_timestamp(),
  `image` varchar(255) DEFAULT 'default.jpg'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `events`
--

INSERT INTO `events` (`event_id`, `organizer_id`, `venue_id`, `category_id`, `title`, `description`, `banner_image`, `start_date`, `end_date`, `status`, `created_at`, `image`) VALUES
(1, 1, 1, 1, 'Judul REv', 'Konferensi teknologi terbesar tahun ini.', NULL, '2025-10-18', '2025-10-19', 'published', '2025-12-17 21:56:12', 'default.jpg'),
(2, 1, 1, 1, 'Seminar IT', 'Seminar IT yang berlangsung online via zoom', NULL, '2025-12-17', '2025-12-17', 'published', '2025-12-17 22:25:06', 'default.jpg'),
(4, 3, 4, 2, 'Konser Indie 2025', 'Hotel Indie Untuk Anak Anak Senja', NULL, '2025-12-20', '2025-12-21', 'published', '2025-12-17 22:51:34', 'default.jpg'),
(5, 4, 1, 2, 'Konser Jazz', 'testing', NULL, '2025-12-17', '2025-12-17', 'published', '2025-12-17 22:57:24', 'default.jpg'),
(6, 3, 1, 1, 'test', 'test', NULL, '2025-12-16', '2025-12-16', 'published', '2025-12-17 23:13:16', '1765988338886.jpeg');

-- --------------------------------------------------------

--
-- Struktur dari tabel `registrations`
--

CREATE TABLE `registrations` (
  `registration_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `booking_code` varchar(20) NOT NULL,
  `registration_date` datetime DEFAULT current_timestamp(),
  `status` enum('pending','paid','cancelled') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `registrations`
--

INSERT INTO `registrations` (`registration_id`, `event_id`, `user_id`, `ticket_id`, `booking_code`, `registration_date`, `status`) VALUES
(1, 1, 1, 2, 'BK-1765984413738', '2025-12-17 22:13:33', 'paid'),
(2, 4, 2, 7, 'BK-1765986712156', '2025-12-17 22:51:52', 'paid'),
(3, 6, 2, 13, 'BK-1765988010547', '2025-12-17 23:13:30', 'paid');

-- --------------------------------------------------------

--
-- Struktur dari tabel `sessions`
--

CREATE TABLE `sessions` (
  `session_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `room_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `sessions`
--

INSERT INTO `sessions` (`session_id`, `event_id`, `title`, `description`, `start_time`, `end_time`, `room_name`) VALUES
(1, 1, 'Keynote Opening', NULL, '2025-10-20 09:00:00', '2025-10-20 10:00:00', 'Main Hall'),
(2, 2, 'Registrasi Ulang', NULL, '2025-12-17 07:30:00', '2025-12-17 10:00:00', 'Main Hall'),
(4, 4, 'Check In', NULL, '2025-12-20 15:00:00', '2025-12-21 23:51:00', 'Main Hall'),
(5, 5, 'Check In', NULL, '2025-12-17 22:57:00', '2025-12-18 22:57:00', 'Main Hall'),
(6, 6, 'Registrasi Ulang', NULL, '2025-12-17 23:13:00', '2025-12-18 23:13:00', 'Main Hall');

-- --------------------------------------------------------

--
-- Struktur dari tabel `session_speakers`
--

CREATE TABLE `session_speakers` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `speaker_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `speakers`
--

CREATE TABLE `speakers` (
  `speaker_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `bio` text DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `ticket_types`
--

CREATE TABLE `ticket_types` (
  `ticket_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `quota` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `ticket_types`
--

INSERT INTO `ticket_types` (`ticket_id`, `event_id`, `name`, `price`, `quota`) VALUES
(1, 1, 'Tiket Regular', 50000.00, 100),
(2, 1, 'Tiket VIP', 150000.00, 20),
(3, 2, 'Regular Ticket', 50000.00, 50),
(7, 4, 'VVIP', 150000.00, 10),
(8, 4, 'VIP', 100000.00, 20),
(9, 4, 'Reguler', 75000.00, 70),
(10, 5, 'VVIP', 150000.00, 10),
(11, 5, 'VIP', 100000.00, 20),
(12, 5, 'Reguler', 75000.00, 70),
(13, 6, 'VVIP', 150000.00, 10),
(14, 6, 'VIP', 100000.00, 20),
(15, 6, 'Reguler', 75000.00, 70);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('admin','organizer','attendee') DEFAULT 'attendee',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `phone`, `role`, `created_at`) VALUES
(1, 'Panitia Inti', 'admin@event.com', 'rahasia', NULL, 'admin', '2025-12-17 21:56:12'),
(2, 'Rafli', 'user@event.com', '$2b$10$6u9i1XIR60n16djOBhn.AOi4B9x5P1mZCUdnf20t0XDmZ7cMu9Cni', NULL, 'attendee', '2025-12-17 22:40:16'),
(3, 'Event Organizer', 'eo@event.com', '$2b$10$IZM.RyLOy5NoqXksLVWmGeJBogEW232bvaRtp9Zfq6CB8ZGVsW.Yu', NULL, 'organizer', '2025-12-17 22:49:10'),
(4, 'Event Organizer 2', 'eo2@event.com', '$2b$10$KtSKq78MdvxfeLYS7NWqJONL9lWnUgU2AWuIKOiTSXMpugqVZr3j.', NULL, 'organizer', '2025-12-17 22:54:20');

-- --------------------------------------------------------

--
-- Struktur dari tabel `venues`
--

CREATE TABLE `venues` (
  `venue_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `type` enum('offline','online','hybrid') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `venues`
--

INSERT INTO `venues` (`venue_id`, `name`, `address`, `city`, `capacity`, `type`) VALUES
(1, 'JCC Senayan', 'Jl. Gatot Subroto', 'Jakarta', 5000, 'offline'),
(2, 'Zoom Meeting (Online)', 'Link akan dikirim via email', 'Online', 1000, 'online'),
(3, 'Hotel Mulia Senayan', 'Jl. Asia Afrika, Senayan', 'Jakarta', 500, 'offline'),
(4, 'Ice BSD Hall 1', 'BSD City', 'Tangerang', 2000, 'offline');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indeks untuk tabel `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `organizer_id` (`organizer_id`),
  ADD KEY `venue_id` (`venue_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indeks untuk tabel `registrations`
--
ALTER TABLE `registrations`
  ADD PRIMARY KEY (`registration_id`),
  ADD UNIQUE KEY `booking_code` (`booking_code`),
  ADD KEY `event_id` (`event_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `ticket_id` (`ticket_id`);

--
-- Indeks untuk tabel `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indeks untuk tabel `session_speakers`
--
ALTER TABLE `session_speakers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `speaker_id` (`speaker_id`);

--
-- Indeks untuk tabel `speakers`
--
ALTER TABLE `speakers`
  ADD PRIMARY KEY (`speaker_id`);

--
-- Indeks untuk tabel `ticket_types`
--
ALTER TABLE `ticket_types`
  ADD PRIMARY KEY (`ticket_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indeks untuk tabel `venues`
--
ALTER TABLE `venues`
  ADD PRIMARY KEY (`venue_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `events`
--
ALTER TABLE `events`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `registrations`
--
ALTER TABLE `registrations`
  MODIFY `registration_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `sessions`
--
ALTER TABLE `sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `session_speakers`
--
ALTER TABLE `session_speakers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `speakers`
--
ALTER TABLE `speakers`
  MODIFY `speaker_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `ticket_types`
--
ALTER TABLE `ticket_types`
  MODIFY `ticket_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `venues`
--
ALTER TABLE `venues`
  MODIFY `venue_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_ibfk_1` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `events_ibfk_2` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`venue_id`),
  ADD CONSTRAINT `events_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`);

--
-- Ketidakleluasaan untuk tabel `registrations`
--
ALTER TABLE `registrations`
  ADD CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `registrations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `registrations_ibfk_3` FOREIGN KEY (`ticket_id`) REFERENCES `ticket_types` (`ticket_id`);

--
-- Ketidakleluasaan untuk tabel `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `session_speakers`
--
ALTER TABLE `session_speakers`
  ADD CONSTRAINT `session_speakers_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `session_speakers_ibfk_2` FOREIGN KEY (`speaker_id`) REFERENCES `speakers` (`speaker_id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `ticket_types`
--
ALTER TABLE `ticket_types`
  ADD CONSTRAINT `ticket_types_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`event_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
