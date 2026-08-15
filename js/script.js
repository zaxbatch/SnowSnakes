// ============================================
// 📦 DATA STORE
// ============================================
const Store = {
    jokes: [],
    doodles: [],
    comics: [],
    episodes: [],
    characters: [],
    fridge: [],
    games: [],
    killerMode: false,
    nextId: 1,
    visitorCount: 42,
    currentUser: null,
    sortMode: 'newest',

    users: [
        { id: 1, username: 'snow_snake_fan', password: 'snake123', avatar: '🐍', displayName: 'Snow Snake Fan' },
        { id: 2, username: 'dad_joke_king', password: 'joke456', avatar: '👑', displayName: 'Dad Joke King' },
        { id: 3, username: 'condiment_lover', password: 'condiment789', avatar: '🌭', displayName: 'Condiment Lover' },
        { id: 4, username: 'fridge_master', password: 'fridge321', avatar: '🧊', displayName: 'Fridge Master' },
        { id: 5, username: 'ketchup_hater', password: 'mustard555', avatar: '🌭', displayName: 'Team Mustard' },
        { id: 6, username: 'game_dev', password: 'gamedev123', avatar: '🎮', displayName: 'Game Dev Extraordinaire' },
    ],

    init: function() {
        // ─── JOKES ───
        this.jokes = [
            { id: this.nextId++, content: "Why don't scientists trust atoms?", punchline: "Because they make up everything!", tags: ['science', 'dad-joke'], series: 'Science', killCount: 42, likes: 15, likedBy: [], comments: [{ user: 'snow_snake_fan', text: 'This one always gets me! 😂', time: '2 hours ago' }], shares: 8, author: 'snow_snake_fan', createdAt: Date.now() - 3600000 * 24 },
            { id: this.nextId++, content: "What do you call a bear with no teeth?", punchline: "A gummy bear!", tags: ['animals', 'food'], series: 'Animals', killCount: 27, likes: 12, likedBy: [], comments: [{ user: 'condiment_lover', text: 'Gummy bears are the best! 🐻', time: '3 hours ago' }], shares: 5, author: 'dad_joke_king', createdAt: Date.now() - 3600000 * 48 },
            { id: this.nextId++, content: "Why did the scarecrow win an award?", punchline: "He was outstanding in his field!", tags: ['agriculture', 'dad-joke'], series: 'Work', killCount: 31, likes: 20, likedBy: [], comments: [], shares: 12, author: 'fridge_master', createdAt: Date.now() - 3600000 * 72 },
            { id: this.nextId++, content: "What's a snow snake's favorite game?", punchline: "Hide and sleak!", tags: ['snowsnakes', 'dad-joke'], series: 'Snowsnakes', killCount: 15, likes: 8, likedBy: [], comments: [{ user: 'ketchup_hater', text: 'Snow snakes are the best! 🐍', time: '5 hours ago' }], shares: 3, author: 'snow_snake_fan', createdAt: Date.now() - 3600000 * 12 },
            { id: this.nextId++, content: "Why don't snow snakes get cold?", punchline: "They're already cool!", tags: ['snowsnakes', 'dad-joke'], series: 'Snowsnakes', killCount: 12, likes: 10, likedBy: [], comments: [], shares: 2, author: 'condiment_lover', createdAt: Date.now() - 3600000 * 6 },
            { id: this.nextId++, content: "What's the best thing about Switzerland?", punchline: "I don't know, but the flag is a big plus!", tags: ['geography', 'dad-joke'], series: 'Geography', killCount: 1337, likes: 25, likedBy: [], comments: [{ user: 'dad_joke_king', text: 'This one killed me! 💀', time: '10 hours ago' }], shares: 20, author: 'fridge_master', createdAt: Date.now() - 3600000 * 36 },
            { id: this.nextId++, content: "I'm reading a book on anti-gravity. It's impossible to put down!", punchline: '', tags: ['books', 'dad-joke'], series: 'Book Jokes', killCount: 0, likes: 5, likedBy: [], comments: [], shares: 1, author: 'ketchup_hater', createdAt: Date.now() - 3600000 * 2 },
            { id: this.nextId++, content: "I told my wife she was drawing her eyebrows too high. She looked surprised!", punchline: '', tags: ['marriage', 'dad-joke'], series: 'Marriage Jokes', killCount: 0, likes: 3, likedBy: [], comments: [], shares: 0, author: 'dad_joke_king', createdAt: Date.now() - 3600000 * 4 },
        ];

        // ─── DOODLES ───
        this.doodles = [
            { id: this.nextId++, title: 'Snow Snake Slither', image: '🐍', jokeId: 4, characterId: null },
            { id: this.nextId++, title: 'Ketchup Klaus Portrait', image: '🍅', jokeId: null, characterId: 3 },
            { id: this.nextId++, title: 'The Fridge of Doom', image: '🧊', jokeId: 6, characterId: null },
            { id: this.nextId++, title: 'Mustard Mike\'s Mustache', image: '🌭', jokeId: null, characterId: 6 },
            { id: this.nextId++, title: 'Salsa Fiesta', image: '🌶️', jokeId: null, characterId: 4 },
            { id: this.nextId++, title: 'Vin Negar Bold', image: '🧅', jokeId: null, characterId: 5 },
        ];

        // ─── COMICS ───
        this.comics = [
            { id: this.nextId++, title: 'The Hood Life', scene: '🚪', dialogue: 'Welcome to The Hood... where condiments dream of the fridge', caption: 'Mayo and Miracle Whip in their early days', characters: ['Mayo', 'Miracle Whip'], author: 'snow_snake_fan', createdAt: Date.now() - 3600000 * 24 * 3 },
            { id: this.nextId++, title: 'The Twins Fight', scene: '🥊', dialogue: 'Mayo and Miracle Whip go at it again!', caption: 'Who will win the condiment war?', characters: ['Mayo', 'Miracle Whip'], author: 'dad_joke_king', createdAt: Date.now() - 3600000 * 24 * 2 },
            { id: this.nextId++, title: 'Fridge Life', scene: '🧊', dialogue: 'Life in the fridge is cold... but the drama is hot!', caption: 'Ketchup tries to make friends', characters: ['Ketchup', 'Salsa'], author: 'condiment_lover', createdAt: Date.now() - 3600000 * 24 },
        ];

        // ─── SPREAD DA WORD ───
        this.episodes = [
            { id: this.nextId++, title: 'Pilot: The Condiment Awakens', scene: '🌟', dialogue: 'In a cabinet far, far away... a condiment is born!', caption: 'The origin story of Mayo and Miracle Whip', characters: ['Mayo', 'Miracle Whip', 'Ketchup'], episodeNumber: 'S1E01', airDate: 'January 15, 2026', featured: true },
            { id: this.nextId++, title: 'The Fridge Move', scene: '🚛', dialogue: 'The condiments finally move to the fridge!', caption: 'But will Ketchup be accepted?', characters: ['Ketchup', 'Salsa', 'Vin Negar'], episodeNumber: 'S1E02', airDate: 'January 22, 2026', featured: false },
            { id: this.nextId++, title: 'Spicy Showdown', scene: '🌶️', dialogue: 'Salsa and Sriracha battle for the hottest spot!', caption: 'Things are heating up in the fridge!', characters: ['Salsa', 'Sriracha', 'Mustard'], episodeNumber: 'S1E03', airDate: 'January 29, 2026', featured: true },
            { id: this.nextId++, title: 'Used Up', scene: '💀', dialogue: 'Every condiment has their time...', caption: 'The cycle of life in the kitchen', characters: ['Mayo'], episodeNumber: 'S1E04', airDate: 'February 5, 2026', featured: false },
        ];

        // ─── CHARACTERS ───
        this.characters = [
            { id: this.nextId++, name: 'Mayo', condiment: '🧈', ethnicity: 'White (Twin)', personality: 'Smooth & Creamy', catchphrase: 'I\'m the smooth operator!', rivals: ['Miracle Whip'], location: 'hood', usedUp: false },
            { id: this.nextId++, name: 'Miracle Whip', condiment: '🥫', ethnicity: 'White (Twin)', personality: 'Tangy & Controversial', catchphrase: 'I\'m not mayo, I\'m better!', rivals: ['Mayo'], location: 'hood', usedUp: false },
            { id: this.nextId++, name: 'Ketchup', condiment: '🍅', ethnicity: 'White', personality: 'Sweet & Untrustworthy', catchphrase: 'Everyone uses me, but nobody trusts me...', rivals: ['Mustard'], location: 'fridge', usedUp: false },
            { id: this.nextId++, name: 'Salsa', condiment: '🌶️', ethnicity: 'Mexican', personality: 'Spicy & Passionate', catchphrase: '¡Ay caramba! Let\'s spice things up!', rivals: ['Ketchup'], location: 'fridge', usedUp: false },
            { id: this.nextId++, name: 'Vin Negar', condiment: '🧅', ethnicity: 'Black', personality: 'Bold & Unapologetic', catchphrase: 'I bring the flavor that cuts through!', rivals: ['Soy Sauce'], location: 'fridge', usedUp: false },
            { id: this.nextId++, name: 'Mustard', condiment: '🌭', ethnicity: 'German', personality: 'Sharp & Traditional', catchphrase: 'I\'m the wurst!', rivals: ['Ketchup'], location: 'hood', usedUp: false },
            { id: this.nextId++, name: 'Sriracha', condiment: '🌶️', ethnicity: 'Thai', personality: 'Fiery & Bold', catchphrase: 'I bring the heat!', rivals: ['Salsa'], location: 'hood', usedUp: false },
        ];

        // ─── FRIDGE ───
        this.fridge = [
            { characterId: 3, shelf: 2 },
            { characterId: 4, shelf: 3 },
            { characterId: 5, shelf: 1 },
        ];

        // ─── GAMES ───
        this.games = [
            {
                id: this.nextId++,
                title: 'Snow Snake Slither',
                description: 'Guide the snow snake through the fridge! Collect condiments and grow!',
                icon: '🐍',
                author: 'snow_snake_fan',
                type: 'builtin',
                code: 'snake',
                votes: 42,
                plays: 128,
                tags: ['arcade', 'classic'],
                fileCount: 0,
                files: [],
                fileContents: {},
                createdAt: Date.now() - 3600000 * 24 * 7
            },
            {
                id: this.nextId++,
                title: 'Fridge Match',
                description: 'Find the matching condiment pairs in this frosty memory game!',
                icon: '🧊',
                author: 'game_dev',
                type: 'builtin',
                code: 'match',
                votes: 31,
                plays: 89,
                tags: ['memory', 'puzzle'],
                fileCount: 0,
                files: [],
                fileContents: {},
                createdAt: Date.now() - 3600000 * 24 * 5
            },
            {
                id: this.nextId++,
                title: 'Condiment Clicker',
                description: 'Click the condiments before they disappear from the fridge!',
                icon: '🌭',
                author: 'dad_joke_king',
                type: 'builtin',
                code: 'clicker',
                votes: 27,
                plays: 156,
                tags: ['arcade', 'fast'],
                fileCount: 0,
                files: [],
                fileContents: {},
                createdAt: Date.now() - 3600000 * 24 * 3
            },
        ];
    },

    login: function(username, password) {
        var user = this.users.find(function(u) { return u.username === username && u.password === password; });
        if (user) { this.currentUser = user; return true; }
        return false;
    },
    logout: function() { this.currentUser = null; this.updateUI(); },
    isLoggedIn: function() { return this.currentUser !== null; },
    getCurrentUser: function() { return this.currentUser; },

    likeJoke: function(jokeId) {
        var joke = this.getJoke(jokeId);
        if (!joke) return false;
        if (!this.isLoggedIn()) { alert('👋 Please log in to like jokes!'); return false; }
        var userId = this.currentUser.username;
        var index = joke.likedBy.indexOf(userId);
        if (index > -1) { joke.likedBy.splice(index, 1); joke.likes--; }
        else { joke.likedBy.push(userId); joke.likes++; }
        return true;
    },
    addComment: function(jokeId, text) {
        var joke = this.getJoke(jokeId);
        if (!joke) return false;
        if (!this.isLoggedIn()) { alert('👋 Please log in to comment!'); return false; }
        if (!text || text.trim() === '') return false;
        joke.comments.push({ user: this.currentUser.username, text: text.trim(), time: 'Just now' });
        return true;
    },
    shareJoke: function(jokeId) {
        var joke = this.getJoke(jokeId);
        if (!joke) return false;
        joke.shares++;
        alert('📤 Share this joke!\n\n"' + joke.content + '"\n\n' + (joke.punchline ? '💡 ' + joke.punchline : ''));
        return true;
    },

    sortJokes: function(mode) { this.sortMode = mode; this.renderJokes(); },
    getSortedJokes: function(jokes) {
        var sorted = jokes.slice();
        switch (this.sortMode) {
            case 'likes': return sorted.sort(function(a, b) { return (b.likes || 0) - (a.likes || 0); });
            case 'newest': return sorted.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
            case 'oldest': return sorted.sort(function(a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
            default: return sorted;
        }
    },

    getCharacter: function(id) { return this.characters.find(function(c) { return c.id === id; }); },
    getJoke: function(id) { return this.jokes.find(function(j) { return j.id === id; }); },
    getDoodle: function(id) { return this.doodles.find(function(d) { return d.id === id; }); },
    getComic: function(id) { return this.comics.find(function(c) { return c.id === id; }); },
    getEpisode: function(id) { return this.episodes.find(function(e) { return e.id === id; }); },
    getGame: function(id) { return this.games.find(function(g) { return g.id === id; }); },

    addJoke: function(data) {
        var joke = { id: this.nextId++, killCount: 0, likes: 0, likedBy: [], comments: [], shares: 0, author: this.currentUser ? this.currentUser.username : 'anonymous', createdAt: Date.now() };
        for (var key in data) { joke[key] = data[key]; }
        this.jokes.push(joke);
        return joke;
    },
    addDoodle: function(data) {
        var doodle = { id: this.nextId++ };
        for (var key in data) { doodle[key] = data[key]; }
        this.doodles.push(doodle);
        return doodle;
    },
    addComic: function(data) {
        var comic = { id: this.nextId++, author: this.currentUser ? this.currentUser.username : 'anonymous', createdAt: Date.now() };
        for (var key in data) { comic[key] = data[key]; }
        this.comics.push(comic);
        return comic;
    },
    addGame: function(data) {
        var game = {
            id: this.nextId++,
            author: this.currentUser ? this.currentUser.username : 'anonymous',
            type: 'user',
            votes: 0,
            plays: 0,
            tags: data.tags || [],
            submitted: true,
            fileCount: data.files ? data.files.length : 0,
            files: data.files || [],
            fileContents: data.fileContents || {},
            createdAt: Date.now()
        };
        for (var key in data) { game[key] = data[key]; }
        this.games.push(game);
        return game;
    },

    deleteJoke: function(id) { this.jokes = this.jokes.filter(function(j) { return j.id !== id; }); },
    deleteDoodle: function(id) { this.doodles = this.doodles.filter(function(d) { return d.id !== id; }); },
    deleteComic: function(id) { this.comics = this.comics.filter(function(c) { return c.id !== id; }); },
    deleteGame: function(id) { this.games = this.games.filter(function(g) { return g.id !== id; }); },
    deleteCharacter: function(id) {
        this.characters = this.characters.filter(function(c) { return c.id !== id; });
        this.fridge = this.fridge.filter(function(f) { return f.characterId !== id; });
    },

    killJoke: function(id) {
        var joke = this.getJoke(id);
        if (joke) { joke.killCount = (joke.killCount || 0) + 1; return joke; }
        return null;
    },

    moveCharacter: function(characterId, shelf) {
        var char = this.getCharacter(characterId);
        if (char) {
            char.location = 'fridge';
            this.fridge = this.fridge.filter(function(f) { return f.characterId !== characterId; });
            this.fridge.push({ characterId: characterId, shelf: shelf });
        }
    },
    removeFromFridge: function(characterId) {
        var char = this.getCharacter(characterId);
        if (char) { char.location = 'hood'; this.fridge = this.fridge.filter(function(f) { return f.characterId !== characterId; }); }
    },
    useUpCharacter: function(characterId) {
        var char = this.getCharacter(characterId);
        if (char) { char.usedUp = true; char.location = 'used'; this.fridge = this.fridge.filter(function(f) { return f.characterId !== characterId; }); }
    },

    voteGame: function(gameId) {
        var game = this.getGame(gameId);
        if (!game) return false;
        if (!this.isLoggedIn()) { alert('👋 Please log in to vote for games!'); return false; }
        game.votes = (game.votes || 0) + 1;
        return true;
    },
    playGame: function(gameId) {
        var game = this.getGame(gameId);
        if (!game) return false;
        game.plays = (game.plays || 0) + 1;
        return true;
    },

    getRandomJoke: function() { return this.jokes[Math.floor(Math.random() * this.jokes.length)]; },
    getRandomDoodle: function() { return this.doodles[Math.floor(Math.random() * this.doodles.length)]; },
    getRandomComic: function() { return this.comics[Math.floor(Math.random() * this.comics.length)]; },
    getRandomEpisode: function() { return this.episodes[Math.floor(Math.random() * this.episodes.length)]; },
    getRandomGame: function() { return this.games[Math.floor(Math.random() * this.games.length)]; },
    getRandomCharacter: function() {
        var available = this.characters.filter(function(c) { return !c.usedUp; });
        return available[Math.floor(Math.random() * available.length)];
    },

    updateUI: function() {
        var loginBtn = document.getElementById('login-btn');
        var userInfo = document.getElementById('user-info');
        var userName = document.getElementById('user-name');
        var userAvatar = document.getElementById('user-avatar');
        var welcomeUser = document.getElementById('welcome-user');

        if (this.isLoggedIn()) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.displayName;
            if (userAvatar) userAvatar.textContent = this.currentUser.avatar;
            if (welcomeUser) welcomeUser.textContent = this.currentUser.displayName;
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
            if (welcomeUser) welcomeUser.textContent = 'Guest';
        }
    }
};

// ============================================
// 🎮 GAME FUNCTIONS
// ============================================

function showGame(type) {
    var container = document.getElementById('game-container');
    if (!container) {
        console.warn('⚠️ showGame: game-container not found');
        return;
    }

    if (type === 'builtin') {
        var builtinGames = Store.games.filter(function(g) { return g.type === 'builtin'; });
        container.innerHTML = `
            <div style="padding: 20px;">
                <h3 style="font-family: 'Comic Sans MS', cursive; color: #003399; text-align: center; margin-bottom: 15px;">🎯 Built-in Games</h3>
                <div class="grid-games">
                    ${builtinGames.map(function(game) {
                        return `
                            <div class="game-card">
                                <span class="game-icon">${game.icon}</span>
                                <div class="game-title">${game.title}</div>
                                <div class="game-description">${game.description}</div>
                                <div class="game-meta">👤 ${game.author} • 👍 ${game.votes || 0} • 🎮 ${game.plays || 0}</div>
                                <div class="game-actions">
                                    <button class="btn btn-primary btn-sm play-btn" data-code="${game.code}">
                                        <i class="fas fa-play"></i> PLAY
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="text-align: center; margin-top: 15px;">
                    <button class="btn btn-secondary view-gallery-btn">📚 View All Games</button>
                </div>
            </div>
        `;
        container.querySelectorAll('.play-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var code = this.dataset.code;
                playBuiltinGame(code);
            });
        });
        var galleryBtn = container.querySelector('.view-gallery-btn');
        if (galleryBtn) galleryBtn.addEventListener('click', function() { showGame('gallery'); });
    } else if (type === 'gallery') {
        var allGames = Store.games;
        container.innerHTML = `
            <div style="padding: 20px;">
                <h3 style="font-family: 'Comic Sans MS', cursive; color: #003399; text-align: center; margin-bottom: 15px;">📚 Game Gallery</h3>
                <div style="margin-bottom: 15px; text-align: center;">
                    <button class="btn btn-success btn-sm submit-game-btn">
                        <i class="fas fa-upload"></i> SUBMIT YOUR GAME
                    </button>
                </div>
                <div class="grid-games">
                    ${allGames.map(function(game) {
                        return `
                            <div class="game-card">
                                ${game.submitted ? '<div class="game-badge">🎮 USER</div>' : '<div class="game-badge">⭐ OFFICIAL</div>'}
                                ${game.fileCount > 0 ? '<div class="game-badge" style="right:80px;background:#00cc66;color:#fff;">📁 ' + game.fileCount + '</div>' : ''}
                                <span class="game-icon">${game.icon}</span>
                                <div class="game-title">${game.title}</div>
                                <div class="game-description">${game.description}</div>
                                <div class="game-meta">
                                    👤 ${game.author} • 👍 ${game.votes || 0} • 🎮 ${game.plays || 0}<br>
                                    🏷️ ${game.tags ? game.tags.join(', ') : 'untagged'}
                                    ${game.fileCount > 0 ? '<br>📁 ' + game.fileCount + ' file' + (game.fileCount !== 1 ? 's' : '') : ''}
                                </div>
                                <div class="game-actions">
                                    ${game.type === 'builtin' ? `
                                        <button class="btn btn-primary btn-sm play-btn" data-code="${game.code}">
                                            <i class="fas fa-play"></i> PLAY
                                        </button>
                                    ` : `
                                        <button class="btn btn-primary btn-sm play-user-btn" data-gameid="${game.id}">
                                            <i class="fas fa-play"></i> PLAY
                                        </button>
                                    `}
                                    <button class="btn btn-like btn-sm vote-btn" data-gameid="${game.id}">
                                        <i class="fas fa-thumbs-up"></i> ${game.votes || 0}
                                    </button>
                                    ${Store.currentUser && Store.currentUser.username === game.author ? `
                                        <button class="btn btn-danger btn-sm delete-game-btn" data-gameid="${game.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        container.querySelectorAll('.play-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var code = this.dataset.code;
                playBuiltinGame(code);
            });
        });
        container.querySelectorAll('.play-user-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var gameId = parseInt(this.dataset.gameid);
                playUserGame(gameId);
            });
        });
        container.querySelectorAll('.vote-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var gameId = parseInt(this.dataset.gameid);
                voteGame(gameId);
            });
        });
        container.querySelectorAll('.delete-game-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var gameId = parseInt(this.dataset.gameid);
                deleteGame(gameId);
            });
        });
        var submitBtn = container.querySelector('.submit-game-btn');
        if (submitBtn) submitBtn.addEventListener('click', function() { openModal('addGame'); });
    }
}

function playBuiltinGame(code) {
    var container = document.getElementById('game-container');
    if (!container) return;
    switch (code) {
        case 'snake': playSnakeGame(container); break;
        case 'match': playMatchGame(container); break;
        case 'clicker': playClickerGame(container); break;
        default: container.innerHTML = '<div style="text-align:center;padding:40px;"><h3>Game not found!</h3></div>';
    }
}

function playUserGame(gameId) {
    var game = Store.getGame(gameId);
    if (!game) return;
    Store.playGame(gameId);
    var container = document.getElementById('game-container');
    if (!container) return;
    container.innerHTML = `
        <div class="game-play-area">
            <div class="game-header">
                <div class="game-title-display">🎮 ${game.title}</div>
                <div class="game-controls">
                    <button class="btn btn-secondary btn-sm back-to-gallery">← BACK</button>
                </div>
            </div>
            <div style="text-align:center;padding:40px;background:#f8f9fa;border:3px dashed #000;">
                <div style="font-size:80px;">${game.icon}</div>
                <h3 style="font-family:'Comic Sans MS',cursive;color:#003399;">${game.title}</h3>
                <p style="color:#666;margin:15px 0;">${game.description}</p>
                <button class="btn btn-primary mt-20 launch-game-btn">🚀 LAUNCH GAME</button>
                <button class="btn btn-like btn-sm mt-20 vote-game-btn" data-gameid="${game.id}">
                    <i class="fas fa-thumbs-up"></i> Vote (${game.votes || 0})
                </button>
            </div>
        </div>
    `;
    var backBtn = container.querySelector('.back-to-gallery');
    if (backBtn) backBtn.addEventListener('click', function() { showGame('gallery'); });
    var launchBtn = container.querySelector('.launch-game-btn');
    if (launchBtn) launchBtn.addEventListener('click', function() {
        alert('🎮 Launching ' + game.title + '!');
    });
    var voteBtn = container.querySelector('.vote-game-btn');
    if (voteBtn) voteBtn.addEventListener('click', function(e) {
        var id = parseInt(this.dataset.gameid);
        voteGame(id);
    });
}

function playSnakeGame(container) {
    container.innerHTML = `
        <div class="game-play-area">
            <div class="game-header">
                <div class="game-title-display">🐍 Snow Snake Slither</div>
                <div class="game-controls">
                    <button class="btn btn-secondary btn-sm back-to-builtin">← BACK</button>
                </div>
            </div>
            <div style="text-align:center;padding:20px;">
                <canvas id="snake-canvas" width="400" height="400" style="border:4px solid #000;background:#1a2a3a;"></canvas>
                <p style="font-size:12px;color:#7f8c8d;">⬆️ ⬇️ ⬅️ ➡️ Arrow keys to move</p>
            </div>
        </div>
    `;
    var backBtn = container.querySelector('.back-to-builtin');
    if (backBtn) backBtn.addEventListener('click', function() { showGame('builtin'); });
}

function playMatchGame(container) {
    container.innerHTML = `
        <div class="game-play-area">
            <div class="game-header">
                <div class="game-title-display">🧊 Fridge Match</div>
                <div class="game-controls">
                    <button class="btn btn-secondary btn-sm back-to-builtin">← BACK</button>
                </div>
            </div>
            <div style="text-align:center;padding:20px;"><p>Memory match game would go here.</p></div>
        </div>
    `;
    var backBtn = container.querySelector('.back-to-builtin');
    if (backBtn) backBtn.addEventListener('click', function() { showGame('builtin'); });
}

function playClickerGame(container) {
    container.innerHTML = `
        <div class="game-play-area">
            <div class="game-header">
                <div class="game-title-display">🌭 Condiment Clicker</div>
                <div class="game-controls">
                    <button class="btn btn-secondary btn-sm back-to-builtin">← BACK</button>
                </div>
            </div>
            <div style="text-align:center;padding:20px;"><p>Clicker game would go here.</p></div>
        </div>
    `;
    var backBtn = container.querySelector('.back-to-builtin');
    if (backBtn) backBtn.addEventListener('click', function() { showGame('builtin'); });
}

// ============================================
// 📁 DRAG & DROP FILE UPLOAD
// ============================================

var uploadedFiles = [];
var uploadedFileContents = {};

function setupDragDrop() {
    var dropZone = document.getElementById('drop-zone');
    var fileInput = document.getElementById('file-input');
    if (!dropZone || !fileInput) return;
    dropZone.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', function(e) { handleFiles(e.target.files); });
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.style.borderColor = '#ff00ff';
        dropZone.style.background = '#ffffcc';
        dropZone.style.transform = 'scale(1.02)';
    });
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dropZone.style.borderColor = '#003399';
        dropZone.style.background = '#f8f9fa';
        dropZone.style.transform = 'scale(1)';
    });
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.style.borderColor = '#003399';
        dropZone.style.background = '#f8f9fa';
        dropZone.style.transform = 'scale(1)';
        var files = e.dataTransfer.files;
        if (files.length > 0) { handleFiles(files); }
    });
}

function handleFiles(files) {
    var fileList = document.getElementById('file-list');
    var status = document.getElementById('upload-status');
    uploadedFiles = [];
    uploadedFileContents = {};
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.type === '' && file.size === 0) continue;
        uploadedFiles.push(file);
        var reader = new FileReader();
        reader.onload = function(e) {
            uploadedFileContents[file.name] = e.target.result;
            updateFileList();
        };
        if (file.type.startsWith('image/') || file.type.startsWith('text/') ||
            file.name.endsWith('.js') || file.name.endsWith('.css') ||
            file.name.endsWith('.html') || file.name.endsWith('.json')) {
            reader.readAsText(file);
        } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }
    if (status) {
        status.textContent = '📁 ' + files.length + ' files uploaded! (' + uploadedFiles.length + ' valid)';
        status.style.color = '#00cc66';
        status.style.fontWeight = '700';
    }
}

function updateFileList() {
    var fileList = document.getElementById('file-list');
    if (!fileList) return;
    var html = '';
    for (var i = 0; i < uploadedFiles.length; i++) {
        var file = uploadedFiles[i];
        var icon = getFileIcon(file.name);
        var size = (file.size / 1024).toFixed(1);
        html += `
            <div style="background:#e8f4f8;border:2px solid #003399;padding:6px 12px;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#003399;font-family:'Comic Sans MS',cursive;">
                ${icon} ${file.name} (${size}KB)
                <button onclick="removeFile('${file.name}')" style="background:none;border:none;color:#ff0000;cursor:pointer;font-weight:900;font-size:14px;">×</button>
            </div>
        `;
    }
    fileList.innerHTML = html;
}

function getFileIcon(filename) {
    var ext = filename.split('.').pop().toLowerCase();
    var icons = {
        'html': '🌐', 'htm': '🌐', 'js': '📜', 'css': '🎨', 'json': '📋',
        'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'svg': '🖼️', 'webp': '🖼️',
        'mp3': '🎵', 'wav': '🎵', 'mp4': '🎬', 'webm': '🎬',
        'pdf': '📄', 'txt': '📝', 'md': '📝', 'zip': '📦', 'rar': '📦', '7z': '📦'
    };
    return icons[ext] || '📄';
}

function removeFile(filename) {
    var index = -1;
    for (var i = 0; i < uploadedFiles.length; i++) {
        if (uploadedFiles[i].name === filename) { index = i; break; }
    }
    if (index > -1) {
        uploadedFiles.splice(index, 1);
        delete uploadedFileContents[filename];
        updateFileList();
        var status = document.getElementById('upload-status');
        if (status) { status.textContent = '📁 ' + uploadedFiles.length + ' files remaining'; }
    }
}

function submitGame() {
    var title = document.getElementById('game-title') ? document.getElementById('game-title').value.trim() : '';
    var description = document.getElementById('game-description') ? document.getElementById('game-description').value.trim() : '';
    var icon = document.getElementById('game-icon') ? document.getElementById('game-icon').value.trim() || '🎮' : '🎮';
    var code = document.getElementById('game-code') ? document.getElementById('game-code').value.trim() || '' : '';
    var tags = document.getElementById('game-tags') ? document.getElementById('game-tags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];

    if (!title || !description) {
        alert('Please provide a title and description for your game!');
        return;
    }

    var gameData = {
        title: title,
        description: description,
        icon: icon,
        code: code,
        tags: tags,
        files: uploadedFiles.map(function(f) { return f.name; }),
        fileContents: uploadedFileContents,
        fileCount: uploadedFiles.length
    };

    Store.addGame(gameData);
    closeModal();
    uploadedFiles = [];
    uploadedFileContents = {};
    alert('🎮 "' + title + '" has been submitted with ' + gameData.fileCount + ' file' + (gameData.fileCount !== 1 ? 's' : '') + '!');
    renderAll();
    showGame('gallery');
}

// ============================================
// 🎨 RENDER FUNCTIONS
// ============================================

function renderAll() {
    console.log('🔄 renderAll() called');
    renderJokes();
    renderDoodles();
    renderComics();
    renderSpread();
    renderHood();
    renderFridge();
    renderStats();
    Store.updateUI();
}

function renderJokes() {
    var container = document.getElementById('joke-list');
    if (!container) {
        console.warn('⚠️ renderJokes: container "joke-list" not found!');
        return;
    }
    var search = document.getElementById('joke-search') ? document.getElementById('joke-search').value.toLowerCase() : '';
    var jokes = Store.jokes;
    if (search) {
        jokes = jokes.filter(function(j) {
            return j.content.toLowerCase().indexOf(search) > -1 ||
                j.tags.some(function(t) { return t.toLowerCase().indexOf(search) > -1; });
        });
    }
    jokes = Store.getSortedJokes(jokes);
    if (jokes.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span class="empty-icon">😢</span><p>NO JOKES FOUND!</p></div>`;
        return;
    }
    var html = '';
    for (var i = 0; i < jokes.length; i++) {
        var joke = jokes[i];
        var isQnA = joke.punchline && joke.punchline.trim().length > 0;
        var killerClass = Store.killerMode && joke.killCount > 50 ? 'killer' : '';
        if (isQnA) {
            html += `
                <div class="flip-card ${killerClass}" onclick="this.classList.toggle('flipped')">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div class="flip-actions">
                                ${Store.killerMode ? '<span style="color:#ff0000;font-weight:900;font-size:10px;">💀' + (joke.killCount || 0) + '</span>' : ''}
                                <button class="btn btn-danger btn-sm delete-joke-btn" data-id="${joke.id}"><i class="fas fa-trash"></i></button>
                            </div>
                            <div class="card-question">${joke.content}</div>
                            ${joke.series ? '<div class="card-series">📚 ' + joke.series + '</div>' : ''}
                            <div class="card-tags">${joke.tags.map(function(tag) { return '<span class="tag">#' + tag + '</span>'; }).join('')}</div>
                            <div class="card-meta">👤 ${joke.author || 'anon'} • 🕐 ${formatTime(joke.createdAt)}</div>
                            ${renderSocialButtons(joke)}
                            <div class="flip-hint">👆 Click to reveal</div>
                            <div class="click-indicator">🔄</div>
                        </div>
                        <div class="flip-card-back">
                            <div class="card-answer-emoji">💡</div>
                            <div class="card-answer">${joke.punchline}</div>
                            ${joke.series ? '<div class="card-series">📚 ' + joke.series + '</div>' : ''}
                            <div class="flip-hint-back">👆 Flip back</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="card ${killerClass}">
                    <div class="card-header">
                        <div class="card-title">"${joke.content}"</div>
                        <div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${Store.killerMode ? '<span style="color:#ff0000;font-weight:900;font-size:12px;">💀' + (joke.killCount || 0) + '</span>' : ''}
                            <button class="btn btn-danger btn-sm delete-joke-btn" data-id="${joke.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${joke.series ? '<div class="card-series">📚 ' + joke.series + '</div>' : ''}
                    <div class="card-tags">${joke.tags.map(function(tag) { return '<span class="tag">#' + tag + '</span>'; }).join('')}</div>
                    <div class="card-meta">👤 ${joke.author || 'anon'} • 🕐 ${formatTime(joke.createdAt)}</div>
                    ${Store.killerMode && joke.killCount > 100 ? '<div style="margin-top:8px;background:#ff0000;color:#fff;padding:4px 8px;border:2px solid #000;font-weight:900;text-align:center;font-size:10px;">⚠️ LEGENDARY ⚠️</div>' : ''}
                    ${renderSocialButtons(joke)}
                </div>
            `;
        }
    }
    container.innerHTML = html;

    container.querySelectorAll('.delete-joke-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            if (confirm('Delete this joke?')) {
                Store.deleteJoke(id);
                renderAll();
            }
        });
    });
    container.querySelectorAll('.like-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            toggleLike(id);
        });
    });
    container.querySelectorAll('.comment-toggle-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            var section = document.getElementById('comments-' + id);
            if (section) section.classList.toggle('open');
        });
    });
    container.querySelectorAll('.comment-submit-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            var input = document.getElementById('comment-input-' + id);
            if (!input) return;
            var text = input.value.trim();
            if (Store.addComment(id, text)) {
                input.value = '';
                renderAll();
                var section = document.getElementById('comments-' + id);
                if (section) section.classList.add('open');
            }
        });
    });
    container.querySelectorAll('.share-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            shareJoke(id);
        });
    });
    container.querySelectorAll('.kill-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            killJoke(id);
        });
    });
}

function renderSocialButtons(joke) {
    var isLiked = Store.isLoggedIn() && joke.likedBy && joke.likedBy.indexOf(Store.currentUser.username) > -1;
    return `
        <div class="social-actions">
            <button class="btn btn-like btn-sm like-btn ${isLiked ? 'liked' : ''}" data-id="${joke.id}">
                <i class="fas fa-heart"></i> ${joke.likes || 0}
            </button>
            <button class="btn btn-comment btn-sm comment-toggle-btn" data-id="${joke.id}">
                <i class="fas fa-comment"></i> ${joke.comments ? joke.comments.length : 0}
            </button>
            <button class="btn btn-share btn-sm share-btn" data-id="${joke.id}">
                <i class="fas fa-share"></i> ${joke.shares || 0}
            </button>
            ${Store.killerMode ? '<button class="btn btn-warning btn-sm kill-btn" data-id="' + joke.id + '"><i class="fas fa-bomb"></i></button>' : ''}
        </div>
        <div class="comments-section" id="comments-${joke.id}">
            <div class="comment-input">
                <input type="text" id="comment-input-${joke.id}" placeholder="Comment..." />
                <button class="btn btn-success btn-sm comment-submit-btn" data-id="${joke.id}">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
            <div id="comment-list-${joke.id}">
                ${joke.comments && joke.comments.length > 0 ? joke.comments.map(function(c) {
                    return `<div class="comment-item"><span class="comment-user">${c.user}</span> <span class="comment-text">${c.text}</span> <span class="comment-time">${c.time}</span></div>`;
                }).join('') : '<div style="color:#95a5a6;font-size:10px;padding:4px;">No comments yet.</div>'}
            </div>
        </div>
    `;
}

function renderDoodles() {
    var container = document.getElementById('doodle-list');
    if (!container) {
        console.warn('⚠️ renderDoodles: container "doodle-list" not found!');
        return;
    }
    var doodles = Store.doodles;
    if (doodles.length === 0) {
        container.innerHTML = `<div class="empty-state"><span class="empty-icon">🎨</span><p>NO DOODLES YET!</p></div>`;
        return;
    }
    var html = doodles.map(function(d) {
        var joke = Store.getJoke(d.jokeId);
        var character = Store.getCharacter(d.characterId);
        return `
            <div class="doodle-card">
                <span class="doodle-art">${d.image}</span>
                <div class="card-title">${d.title}</div>
                ${joke ? '<div style="font-size:12px;color:#666;">😂 "' + joke.content.substring(0, 30) + '..."</div>' : ''}
                ${character ? '<div style="font-size:12px;color:#003399;">' + character.condiment + ' ' + character.name + '</div>' : ''}
                <button class="btn btn-danger btn-sm mt-20 delete-doodle-btn" data-id="${d.id}"><i class="fas fa-trash"></i> DELETE</button>
            </div>
        `;
    }).join('');
    container.innerHTML = html;
    container.querySelectorAll('.delete-doodle-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = parseInt(this.dataset.id);
            if (confirm('Delete this doodle?')) {
                Store.deleteDoodle(id);
                renderAll();
            }
        });
    });
}

function renderComics() {
    var container = document.getElementById('comic-list');
    if (!container) {
        console.warn('⚠️ renderComics: container "comic-list" not found!');
        return;
    }
    var comics = Store.comics;
    if (comics.length === 0) {
        container.innerHTML = `<div class="empty-state"><span class="empty-icon">📢</span><p>NO COMICS YET!</p></div>`;
        return;
    }
    var html = comics.map(function(c) {
        return `
            <div class="comic-card">
                <h3 style="font-family:'Comic Sans MS',cursive;color:#660099;">${c.title}</h3>
                <div class="comic-panel">
                    <span class="scene">${c.scene}</span>
                    <div class="dialogue">"${c.dialogue}"</div>
                    <div class="caption">${c.caption}</div>
                </div>
                ${c.characters ? '<div style="font-size:12px;color:#666;font-weight:700;">🌟 Featuring: ' + c.characters.join(', ') + '</div>' : ''}
                <div style="font-size:10px;color:#7f8c8d;margin-top:8px;">✏️ By ${c.author || 'anonymous'} • 🕐 ${formatTime(c.createdAt)}</div>
                <button class="btn btn-danger btn-sm mt-20 delete-comic-btn" data-id="${c.id}"><i class="fas fa-trash"></i> DELETE</button>
            </div>
        `;
    }).join('');
    container.innerHTML = html;
    container.querySelectorAll('.delete-comic-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = parseInt(this.dataset.id);
            if (confirm('Delete this comic?')) {
                Store.deleteComic(id);
                renderAll();
            }
        });
    });
}

function renderSpread() {
    var container = document.getElementById('spread-list');
    if (!container) {
        console.warn('⚠️ renderSpread: container "spread-list" not found!');
        return;
    }
    var episodes = Store.episodes;
    if (episodes.length === 0) {
        container.innerHTML = `<div class="empty-state"><span class="empty-icon">📺</span><p>NO EPISODES YET! STAY TUNED!</p></div>`;
        return;
    }
    var html = episodes.map(function(ep) {
        return `
            <div class="spread-card">
                <div class="episode-badge">${ep.episodeNumber || 'SPECIAL'}</div>
                ${ep.featured ? '<div class="episode-featured">⭐ FEATURED</div>' : ''}
                <h3 style="font-family:'Comic Sans MS',cursive;color:#e67e22;">${ep.title}</h3>
                <div class="spread-panel">
                    <span class="scene">${ep.scene}</span>
                    <div class="dialogue">"${ep.dialogue}"</div>
                    <div class="caption">${ep.caption}</div>
                </div>
                ${ep.characters ? '<div style="font-size:12px;color:#666;font-weight:700;">🌟 Featuring: ' + ep.characters.join(', ') + '</div>' : ''}
                <div class="spread-meta">
                    <span class="episode-number">${ep.episodeNumber || 'SPECIAL'}</span>
                    <span class="episode-date">📅 ${ep.airDate || 'TBA'}</span>
                </div>
                <div class="spread-view-only">🎬 Official Episode — Watch Only</div>
            </div>
        `;
    }).join('');
    container.innerHTML = html;
}

function renderHood() {
    var container = document.getElementById('hood-characters');
    if (!container) return;
    var hoodChars = Store.characters.filter(function(c) { return c.location === 'hood' && !c.usedUp; });
    if (hoodChars.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);font-family:'Comic Sans MS',cursive;"><div style="font-size:40px;">🚪</div><p>THE HOOD IS EMPTY!</p></div>`;
        return;
    }
    var html = hoodChars.map(function(char) {
        return `
            <div class="fridge-item" style="background:linear-gradient(135deg,#ffffcc,#ffffff);">
                <span class="condiment">${char.condiment}</span>
                ${char.name}
                <span class="ethnicity-tag">${char.ethnicity}</span>
                <button class="btn btn-success btn-sm move-to-fridge-btn" data-id="${char.id}" style="padding:2px 10px;font-size:10px;">⬆️ MOVE UP</button>
            </div>
        `;
    }).join('');
    container.innerHTML = html;
    container.querySelectorAll('.move-to-fridge-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = parseInt(this.dataset.id);
            moveToFridge(id);
        });
    });
}

function renderFridge() {
    var container = document.getElementById('fridge-map');
    if (!container) return;
    var shelves = 5;
    var html = '';
    for (var i = shelves; i >= 1; i--) {
        var items = Store.fridge.filter(function(f) { return f.shelf === i; });
        html += '<div class="shelf" data-shelf="' + i + '">';
        html += '<span class="shelf-label">SHELF ' + i + '</span>';
        items.forEach(function(f) {
            var char = Store.getCharacter(f.characterId);
            if (!char || char.usedUp) return;
            html += `
                <div class="fridge-item" draggable="true" data-charid="${char.id}" 
                     ondragstart="dragStart(event)" ondragend="dragEnd(event)">
                    <span class="condiment">${char.condiment}</span>
                    ${char.name}
                    <span class="ethnicity-tag">${char.ethnicity}</span>
                    <button class="btn btn-warning btn-sm remove-from-fridge-btn" data-id="${char.id}" style="padding:2px 8px;font-size:10px;">⬇️</button>
                    <button class="btn btn-danger btn-sm use-up-btn" data-id="${char.id}" style="padding:2px 8px;font-size:10px;">💀</button>
                </div>
            `;
        });
        if (items.length === 0) html += '<span style="color:rgba(255,255,255,0.2);font-size:12px;font-family:\'Comic Sans MS\',cursive;">Empty shelf</span>';
        html += '</div>';
    }
    container.innerHTML = html;
    container.querySelectorAll('.remove-from-fridge-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = parseInt(this.dataset.id);
            removeFromFridge(id);
        });
    });
    container.querySelectorAll('.use-up-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = parseInt(this.dataset.id);
            useUpCharacter(id);
        });
    });
    container.querySelectorAll('.shelf').forEach(function(shelf) {
        shelf.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.background = 'rgba(255,255,255,0.15)';
        });
        shelf.addEventListener('dragleave', function() {
            this.style.background = 'rgba(255,255,255,0.05)';
        });
        shelf.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.background = 'rgba(255,255,255,0.05)';
            var charId = parseInt(e.dataTransfer.getData('text/plain'));
            var shelfNum = parseInt(this.dataset.shelf);
            if (charId && shelfNum) {
                Store.moveCharacter(charId, shelfNum);
                renderAll();
            }
        });
    });
}

function renderStats() {
    var jokesEl = document.getElementById('stats-jokes');
    var doodlesEl = document.getElementById('stats-doodles');
    var comicsEl = document.getElementById('stats-comics');
    var spreadEl = document.getElementById('stats-spread');
    var gamesEl = document.getElementById('stats-games');
    var counterEl = document.getElementById('visitor-counter');
    if (jokesEl) jokesEl.textContent = Store.jokes.length + ' Jokes';
    if (doodlesEl) doodlesEl.textContent = Store.doodles.length + ' Doodles';
    if (comicsEl) comicsEl.textContent = Store.comics.length + ' Comics';
    if (spreadEl) spreadEl.textContent = Store.episodes.length + ' Episodes';
    if (gamesEl) gamesEl.textContent = Store.games.length + ' Games';
    Store.visitorCount++;
    if (counterEl) counterEl.textContent = String(Store.visitorCount).padStart(8, '0');
}

function formatTime(timestamp) {
    if (!timestamp) return 'just now';
    var diff = Date.now() - timestamp;
    var minutes = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    return days + 'd ago';
}

// ============================================
// 🎮 ACTION FUNCTIONS
// ============================================

function toggleLike(jokeId) {
    if (Store.likeJoke(jokeId)) renderAll();
}

function shareJoke(jokeId) {
    Store.shareJoke(jokeId);
    renderAll();
}

function sortJokes(mode) {
    Store.sortJokes(mode);
    renderJokes();
}

function voteGame(gameId) {
    if (Store.voteGame(gameId)) {
        showGame('gallery');
    }
}

function deleteGame(gameId) {
    if (confirm('Delete this game?')) {
        Store.deleteGame(gameId);
        showGame('gallery');
    }
}

function killJoke(id) {
    var joke = Store.killJoke(id);
    if (joke) {
        renderAll();
        var messages = [
            '💀 THAT JOKE KILLED ' + joke.killCount + ' PEOPLE!',
            '⚰️ ' + joke.killCount + ' VICTIMS AND COUNTING!',
            '🐍 THE SNOW SNAKE IS IMPRESSED!'
        ];
        setTimeout(function() { alert(messages[Math.floor(Math.random() * messages.length)]); }, 300);
    }
}

// ============================================
// 🎭 MODAL SYSTEM
// ============================================

function openModal(type) {
    var overlay = document.getElementById('modal-overlay');
    var title = document.getElementById('modal-title');
    var content = document.getElementById('modal-content');
    if (!overlay || !content) return;

    var forms = {
        login: `
            <h3 style="color: #003399; font-family: 'Comic Sans MS', cursive;">👋 LOGIN TO SNOWSNAKES</h3>
            <div style="background: #ffffcc; border: 3px solid #ff9900; padding: 12px; border-radius: 15px; margin-bottom: 20px;">
                <div style="font-size: 13px; color: #666;">
                    <strong>Demo Accounts:</strong><br>
                    snow_snake_fan / snake123<br>
                    dad_joke_king / joke456<br>
                    condiment_lover / condiment789<br>
                    fridge_master / fridge321<br>
                    ketchup_hater / mustard555<br>
                    game_dev / gamedev123
                </div>
            </div>
            <div class="form-group">
                <label>👤 USERNAME</label>
                <input class="form-control" id="login-username" placeholder="Enter username" />
            </div>
            <div class="form-group">
                <label>🔒 PASSWORD</label>
                <input class="form-control" id="login-password" placeholder="Enter password" type="password" />
            </div>
            <button class="btn btn-primary" onclick="submitLogin()" style="width: 100%;">
                <i class="fas fa-sign-in-alt"></i> LOGIN
            </button>
            <div style="margin-top: 10px; text-align: center; font-size: 12px; color: #7f8c8d;">
                ⚡ No real accounts needed — just testing!
            </div>
        `,
        addJoke: `
            <h3 style="color: #003399; font-family: 'Comic Sans MS', cursive;">🐍 ADD A JOKE</h3>
            <div style="background: #ffffcc; border: 3px solid #ff9900; padding: 12px; border-radius: 15px; margin-bottom: 20px;">
                <div style="font-size: 14px; font-weight: 700; color: #003399;">📝 Two Ways to Add a Joke:</div>
                <div style="font-size: 13px; color: #666; margin-top: 5px;">
                    <strong>1. Question & Answer:</strong> Fill in both fields below for a flip card!<br>
                    <strong>2. One-liner:</strong> Just fill in the "Joke Content" field.
                </div>
            </div>
            <div class="form-group">
                <label>❓ QUESTION / SETUP <span style="color: #ff0000;">*</span></label>
                <textarea class="form-control" id="joke-content" placeholder="e.g., Why don't scientists trust atoms?" style="min-height: 60px;"></textarea>
            </div>
            <div class="form-group">
                <label>💡 PUNCHLINE / ANSWER <span style="color: #7f8c8d;">(optional)</span></label>
                <input class="form-control" id="joke-punchline" placeholder="e.g., Because they make up everything!" />
                <div style="font-size: 11px; color: #7f8c8d; margin-top: 4px;">
                    ⚡ If you fill this in, your joke becomes a flip card! Click to reveal the answer.
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>🏷️ TAGS (comma separated)</label>
                    <input class="form-control" id="joke-tags" placeholder="dad-joke, science, food" />
                </div>
                <div class="form-group">
                    <label>📚 SERIES</label>
                    <input class="form-control" id="joke-series" placeholder="e.g., Science Jokes" />
                </div>
            </div>
            ${!Store.isLoggedIn() ? '<div style="background: #ffcccc; border: 3px solid #ff0000; padding: 10px; border-radius: 15px; margin-bottom: 15px; text-align: center;"><span style="font-weight: 700; color: #ff0000;">⚠️ You\'re not logged in! Jokes will be posted as "anonymous".</span></div>' : ''}
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn btn-success" onclick="submitJoke()" style="flex: 1;">
                    <i class="fas fa-save"></i> SAVE JOKE
                </button>
                <button class="btn btn-secondary" onclick="closeModal()" style="flex: 0.5;">
                    CANCEL
                </button>
            </div>
            <div style="margin-top: 15px; padding: 10px; background: #e8f4f8; border-radius: 15px; border: 2px solid #3498db;">
                <div style="font-size: 12px; color: #003399; font-weight: 700;">💡 TIPS:</div>
                <div style="font-size: 11px; color: #666;">
                    • QnA jokes become <strong>flip cards</strong> — click to reveal the answer!<br>
                    • One-liners display as <strong>regular cards</strong><br>
                    • Add <strong>tags</strong> to organize your jokes
                </div>
            </div>
        `,
        addDoodle: `
            <h3 style="color: #00cc66; font-family: 'Comic Sans MS', cursive;">🎨 UPLOAD A DOODLE</h3>
            <div class="form-group">
                <label>TITLE</label>
                <input class="form-control" id="doodle-title" placeholder="Doodle title" />
            </div>
            <div class="form-group">
                <label>DOODLE EMOJI</label>
                <input class="form-control" id="doodle-image" placeholder="🎨" maxlength="2" />
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>JOKE ID (optional)</label>
                    <input class="form-control" id="doodle-joke" placeholder="Joke ID" type="number" />
                </div>
                <div class="form-group">
                    <label>CHARACTER ID (optional)</label>
                    <input class="form-control" id="doodle-character" placeholder="Character ID" type="number" />
                </div>
            </div>
            <button class="btn btn-success" onclick="submitDoodle()">
                <i class="fas fa-upload"></i> UPLOAD DOODLE
            </button>
        `,
        addComic: `
            <h3 style="color: #660099; font-family: 'Comic Sans MS', cursive;">📢 CREATE A COMIC</h3>
            <div class="form-group">
                <label>TITLE</label>
                <input class="form-control" id="comic-title" placeholder="Comic title..." />
            </div>
            <div class="form-group">
                <label>SCENE EMOJI</label>
                <input class="form-control" id="comic-scene" placeholder="🚪" maxlength="2" />
            </div>
            <div class="form-group">
                <label>DIALOGUE</label>
                <textarea class="form-control" id="comic-dialogue" placeholder="What do the characters say?"></textarea>
            </div>
            <div class="form-group">
                <label>CAPTION</label>
                <input class="form-control" id="comic-caption" placeholder="Narrator caption..." />
            </div>
            <div class="form-group">
                <label>CHARACTERS (comma separated)</label>
                <input class="form-control" id="comic-characters" placeholder="Mayo, Ketchup, Salsa" />
            </div>
            ${!Store.isLoggedIn() ? '<div style="background: #ffcccc; border: 3px solid #ff0000; padding: 10px; border-radius: 15px; margin-bottom: 15px; text-align: center;"><span style="font-weight: 700; color: #ff0000;">⚠️ You\'re not logged in! Comics will be posted as "anonymous".</span></div>' : ''}
            <button class="btn btn-purple" onclick="submitComic()">
                <i class="fas fa-save"></i> PUBLISH COMIC
            </button>
        `,
        addGame: `
            <h3 style="color: #00cc66; font-family: 'Comic Sans MS', cursive;">🎮 SUBMIT A GAME</h3>
            <div style="background: #ffffcc; border: 3px solid #ff9900; padding: 12px; border-radius: 15px; margin-bottom: 20px;">
                <div style="font-size: 13px; color: #666;">📝 Share your game with the community! Fill in the details or drag & drop your game files.</div>
            </div>
            <div class="form-group">
                <label>🎮 GAME TITLE <span style="color: #ff0000;">*</span></label>
                <input class="form-control" id="game-title" placeholder="e.g., Ketchup Run" />
            </div>
            <div class="form-group">
                <label>📝 DESCRIPTION <span style="color: #ff0000;">*</span></label>
                <textarea class="form-control" id="game-description" placeholder="Describe your game..." style="min-height: 60px;"></textarea>
            </div>
            <div class="form-group">
                <label>🎨 GAME ICON <span style="color: #7f8c8d;">(emoji)</span></label>
                <input class="form-control" id="game-icon" placeholder="🎮" maxlength="2" />
            </div>
            <div class="form-group">
                <label>📁 DRAG & DROP YOUR GAME FILES <span style="color: #7f8c8d;">(optional)</span></label>
                <div id="drop-zone" style="border:4px dashed #003399;padding:40px;text-align:center;background:#f8f9fa;cursor:pointer;transition:all 0.3s ease;position:relative;min-height:150px;">
                    <div style="font-size: 50px; margin-bottom: 10px;">📂</div>
                    <p style="color: #003399; font-weight: 700; font-family: 'Comic Sans MS', cursive;">
                        Drag & drop your game files here<br>
                        <span style="font-size: 12px; color: #7f8c8d;">or click to browse</span>
                    </p>
                    <div id="file-list" style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;"></div>
                    <input type="file" id="file-input" style="display:none;" multiple webkitdirectory />
                </div>
                <div style="font-size: 11px; color: #7f8c8d; margin-top: 4px;">📦 Supported: HTML, JS, CSS, PNG, GIF, JPG, and more!</div>
            </div>
            <div class="form-group">
                <label>💻 GAME CODE <span style="color: #7f8c8d;">(optional - JavaScript)</span></label>
                <textarea class="form-control" id="game-code" placeholder="function myGame() { // Your game code here }" style="min-height: 100px; font-family: monospace;"></textarea>
                <div style="font-size: 11px; color: #7f8c8d; margin-top: 4px;">⚡ Share your game logic! Others can view and play it.</div>
            </div>
            <div class="form-group">
                <label>🏷️ TAGS (comma separated)</label>
                <input class="form-control" id="game-tags" placeholder="arcade, puzzle, adventure" />
            </div>
            ${!Store.isLoggedIn() ? '<div style="background: #ffcccc; border: 3px solid #ff0000; padding: 10px; border-radius: 15px; margin-bottom: 15px; text-align: center;"><span style="font-weight: 700; color: #ff0000;">⚠️ You\'re not logged in! Games will be posted as "anonymous".</span></div>' : ''}
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn btn-success" onclick="submitGame()" style="flex: 1;">
                    <i class="fas fa-upload"></i> SUBMIT GAME
                </button>
                <button class="btn btn-secondary" onclick="closeModal()" style="flex: 0.5;">
                    CANCEL
                </button>
            </div>
            <div id="upload-status" style="margin-top: 10px; font-size: 12px; color: #7f8c8d;"></div>
        `
    };

    if (title) title.textContent = type.replace(/([A-Z])/g, ' $1').trim();
    content.innerHTML = forms[type] || '<p>FORM NOT FOUND!</p>';
    overlay.classList.add('active');
    if (type === 'addGame') {
        setTimeout(setupDragDrop, 100);
    }
}

function closeModal() {
    var overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ============================================
// 📝 LOGIN & SUBMIT FUNCTIONS
// ============================================

function submitLogin() {
    var username = document.getElementById('login-username') ? document.getElementById('login-username').value.trim() : '';
    var password = document.getElementById('login-password') ? document.getElementById('login-password').value.trim() : '';
    if (!username || !password) {
        alert('Please enter both username and password!');
        return;
    }
    if (Store.login(username, password)) {
        closeModal();
        renderAll();
        alert('👋 Welcome back, ' + Store.currentUser.displayName + '!');
    } else {
        alert('❌ Invalid username or password. Try again!');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        Store.logout();
        renderAll();
    }
}

function submitJoke() {
    var content = document.getElementById('joke-content') ? document.getElementById('joke-content').value.trim() : '';
    var punchline = document.getElementById('joke-punchline') ? document.getElementById('joke-punchline').value.trim() || '' : '';
    var tags = document.getElementById('joke-tags') ? document.getElementById('joke-tags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
    var series = document.getElementById('joke-series') ? document.getElementById('joke-series').value.trim() || '' : '';
    if (!content) {
        alert('❓ HEY! Write a question or joke content!');
        return;
    }
    Store.addJoke({ content: content, tags: tags, series: series, punchline: punchline || '' });
    closeModal();
    renderAll();
    var messages = ['🐍 THE SNOW SNAKE APPROVES!', '❄️ COLD JOKE, BRO!', '🐍 SLITHER-IFIC!'];
    if (Math.random() > 0.7) {
        setTimeout(function() { alert(messages[Math.floor(Math.random() * messages.length)]); }, 300);
    }
}

function submitDoodle() {
    var title = document.getElementById('doodle-title') ? document.getElementById('doodle-title').value.trim() : '';
    var image = document.getElementById('doodle-image') ? document.getElementById('doodle-image').value.trim() || '🎨' : '🎨';
    var jokeId = document.getElementById('doodle-joke') ? parseInt(document.getElementById('doodle-joke').value) || null : null;
    var characterId = document.getElementById('doodle-character') ? parseInt(document.getElementById('doodle-character').value) || null : null;
    if (!title) {
        alert('GIVE YOUR DOODLE A TITLE!');
        return;
    }
    Store.addDoodle({ title: title, image: image, jokeId: jokeId, characterId: characterId });
    closeModal();
    renderAll();
}

function submitComic() {
    var title = document.getElementById('comic-title') ? document.getElementById('comic-title').value.trim() : '';
    var scene = document.getElementById('comic-scene') ? document.getElementById('comic-scene').value.trim() || '📢' : '📢';
    var dialogue = document.getElementById('comic-dialogue') ? document.getElementById('comic-dialogue').value.trim() : '';
    var caption = document.getElementById('comic-caption') ? document.getElementById('comic-caption').value.trim() : '';
    var characters = document.getElementById('comic-characters') ? document.getElementById('comic-characters').value.split(',').map(function(c) { return c.trim(); }).filter(Boolean) : [];
    if (!title || !dialogue) {
        alert('GIVE YOUR COMIC A TITLE AND DIALOGUE!');
        return;
    }
    Store.addComic({ title: title, scene: scene, dialogue: dialogue, caption: caption, characters: characters });
    closeModal();
    renderAll();
}

// ============================================
// 🧊 FRIDGE ACTIONS
// ============================================

var draggedItem = null;

function dragStart(e) {
    draggedItem = e.target.closest('.fridge-item');
    if (draggedItem) {
        e.dataTransfer.setData('text/plain', draggedItem.dataset.charid);
        setTimeout(function() { draggedItem.style.opacity = '0.5'; }, 0);
    }
}

function dragEnd(e) {
    if (draggedItem) {
        draggedItem.style.opacity = '1';
        draggedItem = null;
    }
}

function moveToFridge(charId) {
    Store.moveCharacter(charId, 3);
    renderAll();
}

function removeFromFridge(charId) {
    Store.removeFromFridge(charId);
    renderAll();
}

function useUpCharacter(charId) {
    if (confirm('MARK THIS CHARACTER AS "USED UP"? THEY\'LL BE REMOVED FROM THE FRIDGE.')) {
        Store.useUpCharacter(charId);
        renderAll();
    }
}

// ============================================
// 💀 KILLER MODE
// ============================================

function toggleKillerMode() {
    Store.killerMode = !Store.killerMode;
    renderAll();
    var btn = document.getElementById('killer-btn');
    if (btn) {
        if (Store.killerMode) {
            btn.innerHTML = '💀 KILLER ON!';
            btn.style.background = '#ff0000';
            btn.style.color = '#ffffff';
            btn.classList.remove('look-at-me');
            btn.classList.add('killer-active');
            var app = document.querySelector('.app');
            if (app) { app.style.borderColor = '#ff0000';
                app.style.borderStyle = 'double'; }
            alert('💀 KILLER MODE ACTIVATED!');
        } else {
            btn.innerHTML = '<i class="fas fa-skull"></i> KILLER MODE';
            btn.style.background = '#ffff00';
            btn.style.color = '#000000';
            btn.classList.remove('killer-active');
            btn.classList.add('look-at-me');
            var app = document.querySelector('.app');
            if (app) { app.style.borderColor = '#ff00ff';
                app.style.borderStyle = 'ridge'; }
        }
    }
}

// ============================================
// 🎲 RANDOMIZER
// ============================================

function getRandom() {
    var joke = Store.getRandomJoke();
    var doodle = Store.getRandomDoodle();
    var comic = Store.getRandomComic();
    var episode = Store.getRandomEpisode();
    var game = Store.getRandomGame();
    var character = Store.getRandomCharacter();
    var container = document.getElementById('random-result');
    var content = document.getElementById('random-content');
    if (!container || !content) return;
    var emojis = ['🐍', '❄️', '🎲', '🌭', '🧈', '🌶️', '🍅', '🧅', '🥫'];
    var emojiEl = document.getElementById('random-emoji');
    var count = 0;
    var interval = setInterval(function() {
        if (emojiEl) emojiEl.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        count++;
        if (count > 10) {
            clearInterval(interval);
            if (emojiEl) emojiEl.textContent = '🐍';
        }
    }, 100);
    setTimeout(function() {
        container.style.display = 'block';
        if (joke && doodle && comic && episode && game && character) {
            var isQnA = joke.punchline && joke.punchline.trim().length > 0;
            content.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 10px;">🐍 THE SNOW SNAKE HAS SPOKEN!</div>
                    <div style="background: #ffffcc; border: 3px solid #000; padding: 15px; margin: 10px 0;">
                        <div style="font-size: 12px; color: #666;">😂 JOKE ${isQnA ? '(Flip Card!)' : ''}</div>
                        <div style="font-weight: 700;">"${joke.content}"</div>
                        ${isQnA ? '<div style="font-size: 14px; color: #e67e22; margin-top: 5px;">💡 ' + joke.punchline + '</div>' : ''}
                        <div style="font-size: 11px; color: #7f8c8d; margin-top: 5px;">❤️ ${joke.likes || 0} likes • 💬 ${joke.comments ? joke.comments.length : 0} comments • 🔄 ${joke.shares || 0} shares</div>
                    </div>
                    <div style="background: #ccffcc; border: 3px solid #000; padding: 15px; margin: 10px 0;">
                        <div style="font-size: 12px; color: #666;">🎨 DOODLE</div>
                        <div style="font-size: 40px;">${doodle.image}</div>
                        <div style="font-weight: 700;">${doodle.title}</div>
                    </div>
                    <div style="background: #cc99ff; border: 3px solid #000; padding: 15px; margin: 10px 0;">
                        <div style="font-size: 12px; color: #666;">📢 COMIC (User)</div>
                        <div style="font-weight: 700;">${comic.title}</div>
                        <div style="font-size: 13px;">"${comic.dialogue}"</div>
                        <div style="font-size: 10px; color: #7f8c8d;">✏️ By ${comic.author || 'anonymous'}</div>
                    </div>
                    <div style="background: #ffcc99; border: 3px solid #000; padding: 15px; margin: 10px 0;">
                        <div style="font-size: 12px; color: #666;">🎬 SPREAD DA WORD (Official)</div>
                        <div style="font-weight: 700;">${episode.title}</div>
                        <div style="font-size: 13px;">"${episode.dialogue}"</div>
                        <div style="font-size: 10px; color: #7f8c8d;">${episode.episodeNumber || 'SPECIAL'} • ${episode.airDate || 'TBA'}</div>
                    </div>
                    <div style="background: #ccffcc; border: 3px solid #000; padding: 15px; margin: 10px 0;">
                        <div style="font-size: 12px; color: #666;">🎮 GAME (${game.submitted ? 'User' : 'Built-in'})</div>
                        <div style="font-size: 40px;">${game.icon}</div>
                        <div style="font-weight: 700;">${game.title}</div>
                        <div style="font-size: 12px;">${game.description}</div>
                        <div style="font-size: 10px; color: #7f8c8d;">👤 ${game.author} • 👍 ${game.votes || 0} • 🎮 ${game.plays || 0}</div>
                        ${game.fileCount > 0 ? '<div style="font-size: 10px; color: #00cc66;">📁 ' + game.fileCount + ' file' + (game.fileCount !== 1 ? 's' : '') + ' included</div>' : ''}
                    </div>
                    <div style="background: #ccffff; border: 3px solid #000; padding: 15px; margin: 10px 0;">
                        <div style="font-size: 12px; color: #666;">🌭 CHARACTER</div>
                        <div style="font-size: 40px;">${character.condiment}</div>
                        <div style="font-weight: 700;">${character.name}</div>
                        <div style="font-size: 14px; color: #003399;">${character.ethnicity}</div>
                        <div style="font-style: italic;">"${character.catchphrase}"</div>
                    </div>
                    ${Store.killerMode ? '<div style="background: #ff0000; color: #fff; padding: 10px; border: 3px solid #000; font-weight: 900;">💀 KILLER MODE ACTIVE</div>' : ''}
                    <div style="margin-top: 15px; font-size: 12px; color: #666;">🌟 Click the button again for another random combo!</div>
                </div>
            `;
        } else {
            content.innerHTML = `<div style="text-align:center;color:#666;padding:20px;"><div style="font-size:40px;">😢</div><p>NOT ENOUGH CONTENT YET!</p></div>`;
        }
    }, 1200);
}

// ============================================
// 🐍 EASTER EGG
// ============================================

var easterClickCount = 0;

function triggerEasterEgg() {
    easterClickCount++;
    var egg = document.getElementById('easter-egg');
    if (easterClickCount === 3) {
        alert('🐍 YOU FOUND THE SNOW SNAKE!');
        if (egg) egg.style.fontSize = '60px';
    } else if (easterClickCount === 5) {
        alert('🌭 WHY DID THE SNOW SNAKE CROSS THE ROAD?\nTO GET TO THE OTHER CONDIMENT!');
        if (egg) {
            egg.style.transform = 'scale(1.5) rotate(360deg)';
            egg.style.opacity = '1';
        }
    } else if (easterClickCount === 7) {
        alert('🧊 YOU\'VE UNLOCKED: CONDIMENT SUPREME!\n🥫 ALL CHARACTERS ARE NOW 20% SPICIER!');
        var app = document.querySelector('.app');
        if (app) app.style.boxShadow = '0 0 50px rgba(255, 0, 255, 0.5)';
        easterClickCount = 0;
    }
}

// ============================================
// 🎮 TAB SWITCHING
// ============================================

function switchTab(tabName) {
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
    var panel = document.getElementById('panel-' + tabName);
    if (panel) panel.classList.add('active');
    var tab = document.querySelector('[data-tab="' + tabName + '"]');
    if (tab) tab.classList.add('active');
    // Always re-render content when switching tabs
    renderAll();
    // Ensure spread and games render their specific content
    if (tabName === 'spread') {
        setTimeout(renderSpread, 50);
    }
    if (tabName === 'games') {
        setTimeout(function() { showGame('builtin'); }, 50);
    }
}

// ============================================
// 🔧 EVENT LISTENERS
// ============================================

function attachEventListeners() {
    // Tab clicks
    document.querySelectorAll('.nav-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            var tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    // Game buttons
    document.querySelectorAll('.game-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var action = this.dataset.action;
            if (action === 'showBuiltin') showGame('builtin');
            else if (action === 'showGallery') showGame('gallery');
            else if (action === 'openModal') openModal(this.dataset.modal);
        });
    });

    // Header buttons
    var loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', function() { openModal('login'); });

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    var killerBtn = document.getElementById('killer-btn');
    if (killerBtn) killerBtn.addEventListener('click', toggleKillerMode);

    document.querySelectorAll('#add-joke-btn, #add-joke-btn2').forEach(function(btn) {
        if (btn) btn.addEventListener('click', function() { openModal('addJoke'); });
    });
    document.querySelectorAll('#add-doodle-btn, #add-doodle-btn2').forEach(function(btn) {
        if (btn) btn.addEventListener('click', function() { openModal('addDoodle'); });
    });
    document.querySelectorAll('#add-comic-btn, #add-comic-btn2').forEach(function(btn) {
        if (btn) btn.addEventListener('click', function() { openModal('addComic'); });
    });

    // Search
    var searchBtn = document.getElementById('search-btn');
    if (searchBtn) searchBtn.addEventListener('click', filterJokes);

    var searchInput = document.getElementById('joke-search');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') filterJokes();
        });
    }

    // Sort buttons
    document.querySelectorAll('[data-sort]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var mode = this.dataset.sort;
            sortJokes(mode);
        });
    });

    // Randomizer
    var randomBtn = document.getElementById('random-btn');
    if (randomBtn) randomBtn.addEventListener('click', getRandom);

    var randomizerBtn = document.getElementById('randomizer-btn');
    if (randomizerBtn) randomizerBtn.addEventListener('click', function() { switchTab('randomizer'); });

    // Easter egg
    var easterEgg = document.getElementById('easter-egg');
    if (easterEgg) easterEgg.addEventListener('click', triggerEasterEgg);

    // ESC to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });

    // Modal overlay click
    var overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // View gallery inside game container (delegated)
    document.addEventListener('click', function(e) {
        var target = e.target.closest('.view-gallery-btn');
        if (target) { e.preventDefault();
            showGame('gallery'); }
    });

    console.log('✅ Event listeners attached.');
}

// ============================================
// 🔍 FILTER
// ============================================

function filterJokes() {
    renderJokes();
}

// ============================================
// 🚀 INIT
// ============================================

function initApp() {
    console.log('🚀 Initializing Snowsnakes...');
    Store.init();
    console.log('📦 Data initialized. Jokes:', Store.jokes.length, 'Doodles:', Store.doodles.length, 'Comics:', Store.comics.length);
    renderAll();
    // Ensure games and spread content are rendered after a short delay
    setTimeout(function() {
        if (document.getElementById('game-container')) {
            showGame('builtin');
        }
        renderSpread();
    }, 100);
    console.log('✅ Snowsnakes initialized!');
}

// ─── START ───
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initApp();
    attachEventListeners();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        initApp();
        attachEventListeners();
    });
}

// ============================================
// 🌐 GLOBAL EXPOSURE (NO eval)
// ============================================
window.switchTab = switchTab;
window.showGame = showGame;
window.renderSpread = renderSpread;
window.renderAll = renderAll;
window.openModal = openModal;
window.closeModal = closeModal;
window.submitJoke = submitJoke;
window.submitDoodle = submitDoodle;
window.submitComic = submitComic;
window.submitGame = submitGame;
window.submitLogin = submitLogin;
window.logout = logout;
window.getRandom = getRandom;
window.triggerEasterEgg = triggerEasterEgg;
window.filterJokes = filterJokes;
window.sortJokes = sortJokes;
window.toggleLike = toggleLike;
window.shareJoke = shareJoke;
window.voteGame = voteGame;
window.deleteGame = deleteGame;
window.killJoke = killJoke;
window.playBuiltinGame = playBuiltinGame;
window.playUserGame = playUserGame;
window.moveToFridge = moveToFridge;
window.removeFromFridge = removeFromFridge;
window.useUpCharacter = useUpCharacter;
window.dragStart = dragStart;
window.dragEnd = dragEnd;
window.removeFile = removeFile;
window.toggleKillerMode = toggleKillerMode;

console.log('✅ All functions exposed globally.');