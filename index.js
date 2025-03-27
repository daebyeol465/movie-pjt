const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const PORT = 3000;
const cors = require('cors');
app.use(cors());

// 데이터베이스 연결
const db = new sqlite3.Database('movies.db');

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

app.get('/movies', (req, res) => {
    db.all("SELECT id, title, original_title, overview, release_date, poster_path, backdrop_path FROM movies", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});