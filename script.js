const API_KEY = '705ce89cb2ec70d946da740f385296fb';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const weatherInfo = document.getElementById('weather-info');
const errorDiv = document.getElementById('error');
const cityElement = document.getElementById('city');
const dateElement = document.getElementById('date');
const temperatureElement = document.getElementById('temperature');
const weatherIcon = document.getElementById('weather-icon');
const descriptionElement = document.getElementById('description');
const feelsLikeElement = document.getElementById('feels-like');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');
const weeklyForecast = document.getElementById('weekly-forecast');
const forecastContainer = document.getElementById('forecast-container');
const cityDetails = document.getElementById('city-details');
const sunriseElement = document.getElementById('sunrise');
const sunsetElement = document.getElementById('sunset');
const pressureElement = document.getElementById('pressure');
const visibilityElement = document.getElementById('visibility');

searchButton.addEventListener('click', () => {
    if (!searchButton.disabled) {
        getWeather();
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !searchButton.disabled) {
        getWeather();
    }
});

function formatDate(date) {
    try {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Date formatting error:', error);
        return 'Date unavailable';
    }
}

function kelvinToCelsius(kelvin) {
    return Math.round(kelvin - 273.15);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

const getWeather = debounce(async function() {
    const city = searchInput.value.trim();
    
    if (!city) return;
    
    searchButton.disabled = true;
    
    try {
        weatherInfo.style.opacity = '0';
        errorDiv.style.opacity = '0';
        weeklyForecast.style.opacity = '0';
        cityDetails.style.opacity = '0';
        
        const weatherResponse = await fetch(
            `${BASE_URL}?q=${city}&appid=${API_KEY}`
        );
        
        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }

        const weatherData = await weatherResponse.json();
        
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${API_KEY}`
        );
        
        const forecastData = await forecastResponse.json();
        
        errorDiv.classList.add('hidden');
        weatherInfo.classList.remove('hidden');
        weeklyForecast.classList.remove('hidden');
        cityDetails.classList.remove('hidden');
        
        setTimeout(() => {
            weatherInfo.style.opacity = '1';
            weeklyForecast.style.opacity = '1';
            cityDetails.style.opacity = '1';
            displayWeather(weatherData);
            displayForecast(forecastData);
            displayCityDetails(weatherData);
        }, 300);
        
    } catch (error) {
        console.error('Weather fetch error:', error);
        handleError();
    } finally {
        setTimeout(() => {
            searchButton.disabled = false;
        }, 1000);
    }
}, 500);

function displayWeather(data) {
    try {
        const temperature = kelvinToCelsius(data.main.temp);
        const feelsLike = kelvinToCelsius(data.main.feels_like);
        
        cityElement.textContent = `${data.name}, ${data.sys.country}`;
        dateElement.textContent = formatDate(new Date());
        temperatureElement.textContent = `${temperature}°C`;
        weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        descriptionElement.textContent = data.weather[0].description;
        feelsLikeElement.textContent = `${feelsLike}°C`;
        humidityElement.textContent = `${data.main.humidity}%`;
        windSpeedElement.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    } catch (error) {
        console.error('Display weather error:', error);
        errorDiv.classList.remove('hidden');
        weatherInfo.classList.add('hidden');
    }
}

function displayForecast(data) {
    forecastContainer.innerHTML = '';
    
    const dailyForecasts = processDailyForecasts(data.list);
    
    dailyForecasts.forEach(forecast => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="day">${formatDate(new Date(forecast.dt * 1000)).split(',')[0]}</div>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="Weather icon">
            <div class="temp">${kelvinToCelsius(forecast.main.temp)}°C</div>
            <div class="temp-range">
                ${kelvinToCelsius(forecast.main.temp_min)}°C / ${kelvinToCelsius(forecast.main.temp_max)}°C
            </div>
        `;
        forecastContainer.appendChild(card);
    });
}

function processDailyForecasts(forecastList) {
    const dailyForecasts = [];
    const seenDates = new Set();
    
    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toDateString();
        if (!seenDates.has(date)) {
            seenDates.add(date);
            dailyForecasts.push(forecast);
        }
    });
    
    return dailyForecasts.slice(0, 7);
}

function displayCityDetails(data) {
    sunriseElement.textContent = formatTime(data.sys.sunrise);
    sunsetElement.textContent = formatTime(data.sys.sunset);
    pressureElement.textContent = `${data.main.pressure} hPa`;
    visibilityElement.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
}

function handleError() {
    weatherInfo.classList.add('hidden');
    weeklyForecast.classList.add('hidden');
    cityDetails.classList.add('hidden');
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
        errorDiv.style.opacity = '1';
    }, 300);
}

window.addEventListener('load', () => {
    searchInput.value = 'delhi';
    getWeather();
});