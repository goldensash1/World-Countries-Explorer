document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const regionFilter = document.getElementById('region-filter');
    const sortFilter = document.getElementById('sort-filter');
    const favoritesToggle = document.getElementById('favorites-toggle');
    const countriesGrid = document.getElementById('countries-grid');
    const loadingElement = document.getElementById('loading');
    const countryModal = document.getElementById('country-modal');
    const backButton = document.getElementById('back-button');
    const countryDetails = document.getElementById('country-details');
    const loadMoreBtn = document.getElementById('load-more');
    
    // State
    let allCountries = [];
    let filteredCountries = [];
    let showFavoritesOnly = false;
    let currentPage = 1;
    const countriesPerPage = 20;
    
    // Initialize the app
    async function init() {
        await fetchCountriesBatch();
        setupEventListeners();
    }
    
    // Fetch countries in batches
    async function fetchCountriesBatch() {
        try {
            loadingElement.style.display = 'flex';
            
            const response = await fetch('https://restcountries.com/v3.1/all');
            if (!response.ok) throw new Error('Failed to fetch countries');
            
            allCountries = await response.json();
            
            // Initial sort
            allCountries.sort((a, b) => b.population - a.population);
            
            // Load first batch
            filteredCountries = [...allCountries];
            renderCountriesBatch();
            
        } catch (error) {
            loadingElement.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading countries. Please try again later.</p>
                </div>
            `;
            console.error('Error fetching countries:', error);
        } finally {
            loadingElement.style.display = 'none';
        }
    }
    
    // Render countries to the grid in batches
    function renderCountriesBatch() {
        const startIndex = (currentPage - 1) * countriesPerPage;
        const endIndex = startIndex + countriesPerPage;
        const countriesToRender = filteredCountries.slice(startIndex, endIndex);
        
        if (currentPage === 1) {
            countriesGrid.innerHTML = ''; // Clear on first load
        }
        
        if (countriesToRender.length === 0) {
            if (currentPage === 1) {
                countriesGrid.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-globe-americas"></i>
                        <p>No countries found matching your criteria.</p>
                    </div>
                `;
            }
            loadMoreBtn.style.display = 'none';
            return;
        }
        
        countriesToRender.forEach(country => {
            const isFav = isFavorite(country.cca3);
            const countryCard = document.createElement('div');
            countryCard.className = 'country-card';
            countryCard.innerHTML = `
                <img src="${country.flags.png}" alt="${country.name.common} flag" class="country-flag">
                <div class="country-info">
                    <h2 class="country-name">
                        ${country.name.common}
                        <button class="favorite-btn ${isFav ? 'active' : ''}" data-code="${country.cca3}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </h2>
                    <p class="country-detail"><span>Population:</span> ${country.population.toLocaleString()}</p>
                    <p class="country-detail"><span>Region:</span> ${country.region}</p>
                    <p class="country-detail"><span>Capital:</span> ${country.capital ? country.capital[0] : 'N/A'}</p>
                </div>
            `;
            
            countryCard.addEventListener('click', () => showCountryDetails(country));
            countriesGrid.appendChild(countryCard);
        });
        
        // Add event listeners to favorite buttons
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const countryCode = btn.getAttribute('data-code');
                const success = toggleFavorite(countryCode);
                
                if (success) {
                    btn.classList.toggle('active');
                    
                    // If in favorites-only mode, refresh the view
                    if (showFavoritesOnly) {
                        filterCountries();
                    }
                }
            });
        });
        
        // Show/hide load more button
        loadMoreBtn.style.display = endIndex < filteredCountries.length ? 'block' : 'none';
    }
    
    // Show country details in modal
    async function showCountryDetails(country) {
        try {
            // Load additional details if needed (for borders)
            const response = await fetch(`https://restcountries.com/v3.1/alpha/${country.cca3}`);
            const [detailedCountry] = await response.json();
            
            // Format currencies
            const currencies = detailedCountry.currencies ? 
                Object.values(detailedCountry.currencies).map(currency => `${currency.name} (${currency.symbol || '—'})`).join(', ') : 
                'N/A';
            
            // Format languages
            const languages = detailedCountry.languages ? 
                Object.values(detailedCountry.languages).join(', ') : 
                'N/A';
            
            // Format borders
            const borderCountries = detailedCountry.borders || [];
            
            // Check if favorite
            const isFav = isFavorite(detailedCountry.cca3);
            
            countryDetails.innerHTML = `
                <img src="${detailedCountry.flags.png}" alt="${detailedCountry.name.common} flag" class="details-flag">
                <div class="details-info">
                    <h2 class="details-name">
                        ${detailedCountry.name.common}
                        <span class="detail-favorite ${isFav ? 'active' : ''}" data-code="${detailedCountry.cca3}">
                            <i class="fas fa-heart"></i>
                        </span>
                    </h2>
                    <div class="details-columns">
                        <div class="details-column">
                            <p class="details-item"><span>Native Name:</span> ${Object.values(detailedCountry.name.nativeName)[0].common}</p>
                            <p class="details-item"><span>Population:</span> ${detailedCountry.population.toLocaleString()}</p>
                            <p class="details-item"><span>Region:</span> ${detailedCountry.region}</p>
                            <p class="details-item"><span>Sub Region:</span> ${detailedCountry.subregion || 'N/A'}</p>
                            <p class="details-item"><span>Capital:</span> ${detailedCountry.capital ? detailedCountry.capital[0] : 'N/A'}</p>
                        </div>
                        <div class="details-column">
                            <p class="details-item"><span>Top Level Domain:</span> ${detailedCountry.tld ? detailedCountry.tld[0] : 'N/A'}</p>
                            <p class="details-item"><span>Currencies:</span> ${currencies}</p>
                            <p class="details-item"><span>Languages:</span> ${languages}</p>
                            <p class="details-item"><span>Driving Side:</span> ${detailedCountry.car?.side || 'N/A'}</p>
                            <p class="details-item"><span>Time Zones:</span> ${detailedCountry.timezones?.join(', ') || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="border-countries">
                        <span class="border-title">Border Countries:</span>
                        ${borderCountries.length > 0 ? 
                            borderCountries.map(border => `
                                <span class="border-country" data-code="${border}">${getCountryNameByCode(border)}</span>
                            `).join('') : 
                            '<span>None</span>'
                        }
                    </div>
                    
                    <!-- Additional Information Sections -->
                    <div class="details-section">
                        <h3 class="section-title">About ${detailedCountry.name.common}</h3>
                        <div class="section-content">
                            <p>${getCountryDescription(detailedCountry)}</p>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3 class="section-title">Culture</h3>
                        <div class="section-content">
                            <p>${getCountryCulture(detailedCountry)}</p>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3 class="section-title">History</h3>
                        <div class="section-content">
                            <p>${getCountryHistory(detailedCountry)}</p>
                        </div>
                    </div>
                    
                    <div class="amazing-fact">
                        <h4 class="fact-title"><i class="fas fa-lightbulb"></i> Amazing Fact</h4>
                        <p>${getAmazingFact(detailedCountry)}</p>
                    </div>
                </div>
            `;
            
            // Add event listener to favorite button in modal
            const favBtn = document.querySelector('.detail-favorite');
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const countryCode = favBtn.getAttribute('data-code');
                const success = toggleFavorite(countryCode);
                
                if (success) {
                    favBtn.classList.toggle('active');
                    
                    // Update the favorite button in the grid if visible
                    const gridFavBtn = document.querySelector(`.favorite-btn[data-code="${countryCode}"]`);
                    if (gridFavBtn) {
                        gridFavBtn.classList.toggle('active');
                    }
                }
            });
            
            // Add event listeners to border countries
            document.querySelectorAll('.border-country').forEach(border => {
                border.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const countryCode = e.target.getAttribute('data-code');
                    const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
                    const [borderCountry] = await response.json();
                    showCountryDetails(borderCountry);
                });
            });
            
            // Show modal
            countryModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error showing country details:', error);
            showToast('Error loading country details', 'error');
        }
    }
    
    // Get country name by alpha3Code
    function getCountryNameByCode(code) {
        const country = allCountries.find(c => c.cca3 === code);
        return country ? country.name.common : code;
    }
    
    // Filter countries based on search, region, and favorites
    function filterCountries() {
        const searchTerm = searchInput.value.toLowerCase();
        const region = regionFilter.value;
        const favorites = showFavoritesOnly ? loadFavorites() : null;
        
        filteredCountries = allCountries.filter(country => {
            const matchesSearch = country.name.common.toLowerCase().includes(searchTerm);
            const matchesRegion = region === '' || country.region === region;
            const matchesFavorites = !showFavoritesOnly || (favorites && favorites.includes(country.cca3));
            
            return matchesSearch && matchesRegion && matchesFavorites;
        });
        
        // Sort countries
        sortCountries();
        
        // Reset to first page when filtering
        currentPage = 1;
        renderCountriesBatch();
    }
    
    // Sort countries based on selected option
    function sortCountries() {
        const sortValue = sortFilter.value;
        
        switch (sortValue) {
            case 'name-asc':
                filteredCountries.sort((a, b) => a.name.common.localeCompare(b.name.common));
                break;
            case 'name-desc':
                filteredCountries.sort((a, b) => b.name.common.localeCompare(a.name.common));
                break;
            case 'population-asc':
                filteredCountries.sort((a, b) => a.population - b.population);
                break;
            case 'population-desc':
                filteredCountries.sort((a, b) => b.population - a.population);
                break;
            default:
                break;
        }
    }
    
    // Load next batch of countries
    function loadMoreCountries() {
        currentPage++;
        renderCountriesBatch();
    }
    
    // Favorite countries functionality
    function loadFavorites() {
        const favorites = localStorage.getItem('favoriteCountries');
        return favorites ? JSON.parse(favorites) : [];
    }
    
    function isFavorite(countryCode) {
        const favorites = loadFavorites();
        return favorites.includes(countryCode);
    }
    
    function toggleFavorite(countryCode) {
        try {
            const favorites = loadFavorites();
            const index = favorites.indexOf(countryCode);
            
            if (index === -1) {
                favorites.push(countryCode);
            } else {
                favorites.splice(index, 1);
            }
            
            localStorage.setItem('favoriteCountries', JSON.stringify(favorites));
            return true;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return false;
        }
    }
    
    // Get country description (mock data)
    function getCountryDescription(country) {
        const descriptions = {
            'USA': 'The United States of America is the world\'s third largest country in size and nearly the third largest in terms of population. Located in North America, the country is bordered on the west by the Pacific Ocean and to the east by the Atlantic Ocean. It has a diverse geography including mountains, plains, and coastlines.',
            'CAN': 'Canada is the second largest country in the world by total area. Known for its vast, untouched landscape and its multicultural heritage, Canada stretches from the Atlantic Ocean to the Pacific Ocean and northward into the Arctic Ocean.',
            'GBR': 'The United Kingdom is an island nation located off the northwestern coast of mainland Europe. Made up of England, Scotland, Wales, and Northern Ireland, it has a long and influential history and is known for its parliamentary system of government and constitutional monarchy.',
        };
        
        return descriptions[country.cca3] || `${country.name.common} is a ${country.region} country with a rich cultural heritage and diverse geography. The country has a population of about ${country.population.toLocaleString()} people and ${country.capital ? `its capital is ${country.capital[0]}` : 'it doesn\'t have an official capital'}.`;
    }
    
    // Get country culture (mock data)
    function getCountryCulture(country) {
        const cultures = {
            'JPN': 'Japanese culture is a fascinating blend of ancient traditions and modern innovations. From tea ceremonies and kabuki theater to cutting-edge technology and anime, Japan offers a unique cultural experience. Respect and harmony are central values in Japanese society.',
            'IND': 'Indian culture is one of the world\'s oldest, with traditions dating back thousands of years. Known for its diverse religions, languages, and cuisines, India is a vibrant mix of colors, festivals, and spiritual practices like yoga and meditation.',
            'BRA': 'Brazilian culture is a lively mix of indigenous, African, and European influences. Famous for Carnival, samba music, and football, Brazil has a warm, festive culture with strong community values and love for music and dance.',
        };
        
        return cultures[country.cca3] || `The culture of ${country.name.common} is influenced by its ${country.region} heritage and unique history. The country's official language${country.languages && Object.keys(country.languages).length > 1 ? 's are' : ' is'} ${country.languages ? Object.values(country.languages).join(', ') : 'not specified'}.`;
    }
    
    // Get country history (mock data)
    function getCountryHistory(country) {
        const histories = {
            'EGY': 'Egypt has one of the longest histories of any country, tracing its heritage back to the 6th–4th millennia BCE. Considered a cradle of civilization, Ancient Egypt saw some of the earliest developments of writing, agriculture, urbanization, organized religion and central government.',
            'CHN': 'China is one of the world\'s oldest civilizations, with a history spanning over 5,000 years. It was home to some of the earliest advancements in philosophy, science, and technology. The Great Wall, Terracotta Army, and Silk Road are testaments to its rich historical legacy.',
            'GRC': 'Greece is considered the birthplace of Western civilization, being the origin of democracy, Western philosophy, the Olympic Games, and major scientific and mathematical principles. Ancient Greek culture has influenced language, politics, and education across the Mediterranean and beyond.',
        };
        
        return histories[country.cca3] || `${country.name.common} has a rich history that has shaped its current identity. ${country.independent ? 'It gained independence in ' + country.independent + '.' : 'It has a long-standing history as a sovereign nation.'} The country's historical development has been influenced by its geographical location in ${country.region}.`;
    }
    
    // Get amazing fact about country (mock data)
    function getAmazingFact(country) {
        const facts = {
            'RUS': 'Russia spans 11 time zones, making it the country with the most time zones in the world.',
            'AUS': 'Australia is the only continent that is also a single country, and it\'s home to the world\'s largest coral reef system, the Great Barrier Reef.',
            'ISL': 'Iceland doesn\'t have mosquitoes. The cold climate and specific conditions make it impossible for them to survive there.',
            'MEX': 'Mexico introduced chocolate, corn, and chilies to the world. Chocolate was first consumed as a bitter drink by the Aztecs.',
            'ZAF': 'South Africa is the only country in the world to have three capital cities: Pretoria (administrative), Cape Town (legislative), and Bloemfontein (judicial).',
        };
        
        return facts[country.cca3] || `Did you know? ${country.name.common} ${country.landlocked ? 'is one of the world\'s landlocked countries' : 'has beautiful coastlines'}, and it covers an area of approximately ${country.area ? country.area.toLocaleString() + ' square kilometers' : 'a significant geographical area'}.`;
    }
    
    // Show toast notification
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Theme toggle
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            themeToggle.querySelector('.theme-icon').innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            themeToggle.querySelector('.theme-text').textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
            
            // Save preference to localStorage
            localStorage.setItem('darkMode', isDarkMode);
        });
        
        // Check for saved theme preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            themeToggle.querySelector('.theme-icon').innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.querySelector('.theme-text').textContent = 'Light Mode';
        }
        
        // Search input
        searchInput.addEventListener('input', filterCountries);
        searchBtn.addEventListener('click', filterCountries);
        
        // Region filter
        regionFilter.addEventListener('change', filterCountries);
        
        // Sort filter
        sortFilter.addEventListener('change', filterCountries);
        
        // Favorites toggle
        favoritesToggle.addEventListener('click', () => {
            showFavoritesOnly = !showFavoritesOnly;
            favoritesToggle.classList.toggle('active');
            favoritesToggle.innerHTML = showFavoritesOnly ? 
                `<i class="fas fa-heart"></i> Show All` : 
                `<i class="far fa-heart"></i> Show Favorites`;
            filterCountries();
        });
        
        // Back button
        backButton.addEventListener('click', () => {
            countryModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        
        // Close modal when clicking outside
        countryModal.addEventListener('click', (e) => {
            if (e.target === countryModal) {
                countryModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
        
        // Load more button
        loadMoreBtn.addEventListener('click', loadMoreCountries);
        
        // Infinite scroll (alternative to load more button)
        window.addEventListener('scroll', () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                loadMoreCountries();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Close modal with ESC key
            if (e.key === 'Escape' && countryModal.style.display === 'block') {
                countryModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            
            // Focus search input with / key
            if (e.key === '/' && document.activeElement !== searchInput) {
                e.preventDefault();
                searchInput.focus();
            }
        });
    }
    
    // Initialize the app
    init();
});