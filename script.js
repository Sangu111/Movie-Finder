
// OMDb API key
const API_KEY = 'e3f878df';

// DOM elements
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const searchForm = document.getElementById('searchForm');
const resultsDiv = document.getElementById('results');
const spinner = document.getElementById('spinner');
const errorMessage = document.getElementById('errorMessage');
const movieModal = document.getElementById('movieModal');
const modalDetails = document.getElementById('modalDetails');
const closeModal = document.getElementById('closeModal');

const PLACEHOLDER_IMG = 'https://via.placeholder.com/320x480?text=No+Image';

// Pagination and search state
let currentPage = 1;
let currentQuery = '';
let totalResults = 0;
const RESULTS_PER_PAGE = 10;


function showSpinner() {
    spinner.style.display = 'flex';
}
function hideSpinner() {
    spinner.style.display = 'none';
}


// Search form submit event
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        searchMovies(searchTerm);
    }
});

// Remove any redundant click event on searchButton to avoid duplicate results
if (searchButton) {
    searchButton.onclick = null;
}


// Render pagination buttons
function renderPagination() {
    paginationDiv.innerHTML = '';
    if (totalResults <= RESULTS_PER_PAGE) return;
    const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = (i === currentPage) ? 'active-page' : '';
        btn.addEventListener('click', () => {
            currentPage = i;
            searchMovies(currentQuery, currentPage);
        });
        paginationDiv.appendChild(btn);
    }
}


// Fetch movies from OMDb API based on search query
async function searchMovies(query) {
    showSpinner();
    errorMessage.textContent = '';
    resultsDiv.innerHTML = '';
    try {
        const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${API_KEY}`);
        const data = await response.json();
        hideSpinner();
        if (data.Response === "True") {
            displayMovies(data.Search);
        } else {
            errorMessage.textContent = 'No movies found. Try a different search.';
        }
    } catch (error) {
        hideSpinner();
        errorMessage.textContent = 'Something went wrong. Please try again later.';
        console.error("Error fetching movies:", error);
    }
}


// Get favorites from localStorage
function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

// Save favorites to localStorage
function saveFavorites(favs) {
    localStorage.setItem('favorites', JSON.stringify(favs));
}

// Check if a movie is in favorites
function isFavorite(imdbID) {
    return getFavorites().some(fav => fav.imdbID === imdbID);
}

// Add a movie to favorites
function addFavorite(movie) {
    const favs = getFavorites();
    if (!isFavorite(movie.imdbID)) {
        favs.push(movie);
        saveFavorites(favs);
        renderFavorites();
    }
}

// Remove a movie from favorites
function removeFavorite(imdbID) {
    let favs = getFavorites();
    favs = favs.filter(fav => fav.imdbID !== imdbID);
    saveFavorites(favs);
    renderFavorites();
}

// Render the favorites section
function renderFavorites() {
    const favs = getFavorites();
    favoritesDiv.innerHTML = '';
    if (favs.length === 0) {
        favoritesDiv.innerHTML = '<p>No favorites yet.</p>';
        return;
    }
    favs.forEach(movie => {
        const favItem = document.createElement('div');
        favItem.classList.add('movie-item');
        favItem.innerHTML = `
            <img src="${movie.Poster !== "N/A" ? movie.Poster : 'placeholder.jpg'}" alt="${movie.Title}">
            <h3>${movie.Title}</h3>
            <p>Year: ${movie.Year}</p>
            <button class="remove-fav">Remove</button>
        `;
        favItem.querySelector('.remove-fav').addEventListener('click', (e) => {
            e.stopPropagation();
            removeFavorite(movie.imdbID);
        });
        favItem.addEventListener('click', () => fetchMovieDetails(movie.imdbID));
        favoritesDiv.appendChild(favItem);
    });
}


// Display search results (movies)
function displayMovies(movies) {
    const grid = document.createElement('div');
    grid.className = 'results-grid';
    movies.forEach(movie => {
        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-item');
        const poster = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : PLACEHOLDER_IMG;
        movieItem.innerHTML = `
            <img src="${poster}" alt="${movie.Title}">
            <h3>${movie.Title}</h3>
            <div class="movie-year">${movie.Year}</div>
            <div class="movie-desc">${movie.Type ? movie.Type.charAt(0).toUpperCase() + movie.Type.slice(1) : ''}</div>
        `;
        // Show movie details in modal on click
        movieItem.addEventListener('click', () => fetchMovieDetails(movie.imdbID, true));
        grid.appendChild(movieItem);
    });
    resultsDiv.appendChild(grid);
}

// Fetch and display details for a single movie (modal)
async function fetchMovieDetails(id, showModal = false) {
    showSpinner();
    try {
        const response = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`);
        const movie = await response.json();
        hideSpinner();
        if (showModal) {
            displayMovieModal(movie);
        }
    } catch (error) {
        hideSpinner();
        modalDetails.innerHTML = `<p style="color:#e50914;">Could not load movie details.</p>`;
    }
}

// Render movie details in the modal
function displayMovieModal(movie) {
    const poster = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : PLACEHOLDER_IMG;
    modalDetails.innerHTML = `
        <img src="${poster}" alt="${movie.Title}" class="modal-poster">
        <h2>${movie.Title}</h2>
        <p><span style="color:#e50914;">${movie.Year}</span> &middot; <strong>${movie.Genre || ''}</strong></p>
        <p><strong>Director:</strong> ${movie.Director || 'N/A'}</p>
        <p><strong>Cast:</strong> ${movie.Actors || 'N/A'}</p>
        <p><strong>Plot:</strong> ${movie.Plot || 'N/A'}</p>
        <p><strong>IMDB Rating:</strong> ${movie.imdbRating || 'N/A'}</p>
        <p><strong>Released:</strong> ${movie.Released || 'N/A'}</p>
    `;
    movieModal.classList.add('show');
}


// Fetch and display details for a single movie
async function fetchMovieDetails(id) {
    showSpinner();
    try {
        const response = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`);
        const movie = await response.json();
        hideSpinner();
        displayMovieDetails(movie);
    } catch (error) {
        hideSpinner();
        console.error("Error fetching movie details:", error);
        movieDetailsDiv.innerHTML = `<p>Could not load movie details.</p>`;
    }
}


// Render movie details in the details section
function displayMovieDetails(movie) {
    // Not used in new UI, but kept for reference
    movieDetailsDiv.innerHTML = `
        <h2>${movie.Title}</h2>
        <p><strong>Genre:</strong> ${movie.Genre}</p>
        <p><strong>Director:</strong> ${movie.Director}</p>
        <p><strong>Plot:</strong> ${movie.Plot}</p>
        <p><strong>Cast:</strong> ${movie.Actors}</p>
    `;
}


// Initial render of favorites
renderFavorites();

// Allow Enter key to trigger search
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});

// Modal close event
closeModal.addEventListener('click', () => {
    movieModal.classList.remove('show');
});
window.addEventListener('click', (e) => {
    if (e.target === movieModal) {
        movieModal.classList.remove('show');
    }
});

// Dark mode toggle
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    // Save preference
    if (document.body.classList.contains('dark')) {
        localStorage.setItem('darkMode', 'on');
        darkModeToggle.textContent = '☀️';
    } else {
        localStorage.setItem('darkMode', 'off');
        darkModeToggle.textContent = '🌙';
    }
});
// On load, set dark mode if preferred
if (localStorage.getItem('darkMode') === 'on') {
    document.body.classList.add('dark');
    darkModeToggle.textContent = '☀️';
}

// Clear favorites button
clearFavoritesBtn.addEventListener('click', () => {
    localStorage.removeItem('favorites');
    renderFavorites();
});
