const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// SQLite3 데이터베이스 생성
const db = new sqlite3.Database('movies.db');

// 🎬 **영화 테이블 및 댓글 테이블 생성**
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY,
            title TEXT,
            original_title TEXT,
            overview TEXT,
            release_date TEXT,
            poster_path TEXT,
            backdrop_path TEXT,
            popularity REAL,
            vote_average REAL,
            vote_count INTEGER,
            genre_ids TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            movie_id INTEGER NOT NULL,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (movie_id) REFERENCES movies(id)
        )
    `);
});

// 🎬 **엑셀 파일에서 영화 데이터 불러와 DB에 저장**
const workbook = xlsx.readFile('movies.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

db.serialize(() => {
    const stmt = db.prepare(`
        INSERT INTO movies (id, title, original_title, overview, release_date, poster_path, backdrop_path, popularity, vote_average, vote_count, genre_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.forEach(row => {
        stmt.run(
            row.ID,
            row.Title,
            row["Original Title"],
            row.Overview,
            row["Release Date"],
            row["Poster Path"],
            row["Backdrop Path"],
            row.Popularity,
            row["Vote Average"],
            row["Vote Count"],
            JSON.stringify(row["Genre IDs"])
        );
    });

    stmt.finalize();
});

// 🎬 **특정 영화 상세 조회 API**
app.get('/movie/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM movies WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "영화를 찾을 수 없습니다." });
        }
        res.json(row);
    });
});

// 🎬 **특정 영화의 댓글 추가 API (POST)**
app.post('/comments', (req, res) => {
    const { movie_id, author, content } = req.body;

    if (!movie_id || !author || !content) {
        return res.status(400).json({ error: "모든 필드를 입력해주세요." });
    }

    const query = `INSERT INTO comments (movie_id, author, content) VALUES (?, ?, ?)`;
    db.run(query, [movie_id, author, content], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, movie_id, author, content, created_at: new Date().toISOString() });
    });
});

// 🎬 **특정 영화의 댓글 가져오기 API (GET)**
app.get('/comments/:movie_id', (req, res) => {
    const { movie_id } = req.params;
    db.all("SELECT * FROM comments WHERE movie_id = ? ORDER BY created_at DESC", [movie_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
