const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const PORT = 3000;
const cors = require('cors');
const bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.json())
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

app.get('/movie/:id', (req, res) => {
    const movieId = req.params.id;
    db.get("SELECT * FROM movies WHERE ID = ?", [movieId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Movie not found" });
            return;
        }
        res.json(row);
    });
});

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

// 🎬 특정 영화의 댓글 가져오기 (GET)
app.get('/comments/:movie_id', (req, res) => {
    const { movie_id } = req.params;
    db.all("SELECT * FROM comments WHERE movie_id = ? ORDER BY created_at DESC", [movie_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});
