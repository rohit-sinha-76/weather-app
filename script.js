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

const loadingDiv = document.createElement('div');
loadingDiv.className = 'loading hidden';
loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
loadingDiv.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';
document.querySelector('.glass-card').appendChild(loadingDiv);

searchButton.addEventListener('click', () => {
    if (!searchButton.disabled) getWeather();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !searchButton.disabled) getWeather();
});

function formatDate(date) {
    try {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Date formatting hiccup:', error);
        return 'Date unavailable';
    }
}

function kelvinToCelsius(kelvin) {
    return Math.round(kelvin - 273.15);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function formatTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function setBackground(weather) {
    const body = document.body;
    switch (weather.toLowerCase()) {
        case 'clear':
            body.style.background = 'linear-gradient(135deg, #87CEEB 0%, #FFD700 100%)';
            break;
        case 'clouds':
            body.style.background = 'linear-gradient(135deg, #87CEEB 0%, #B0C4DE 100%)';
            break;
        case 'rain':
        case 'drizzle':
            body.style.background = 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)';
            break;
        case 'thunderstorm':
            body.style.background = 'linear-gradient(135deg, #87CEEB 0%, #2F4F4F 100%)';
            break;
        case 'snow':
            body.style.background = 'linear-gradient(135deg, #87CEEB 0%, #F0F8FF 100%)';
            break;
        default:
            body.style.background = 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)';
    }
}

const getWeather = debounce(async function () {
    const city = searchInput.value.trim();
    if (!city) return;

    searchButton.disabled = true;
    loadingDiv.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
    weeklyForecast.classList.add('hidden');
    cityDetails.classList.add('hidden');
    errorDiv.classList.add('hidden');

    try {
        const weatherResponse = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}`);
        if (!weatherResponse.ok) throw new Error('City not found!');
        const weatherData = await weatherResponse.json();

        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${API_KEY}`
        );
        const forecastData = await forecastResponse.json();

        weatherInfo.classList.remove('hidden');
        weeklyForecast.classList.remove('hidden');
        cityDetails.classList.remove('hidden');
        setTimeout(() => {
            displayWeather(weatherData);
            displayForecast(forecastData);
            displayCityDetails(weatherData);
            setBackground(weatherData.weather[0].main);
            loadingDiv.classList.add('hidden');
        }, 200);
    } catch (error) {
        console.error('Fetch failed:', error);
        handleError(error.message);
    } finally {
        searchButton.disabled = false;
    }
}, 500);

function displayWeather(data) {
    try {
        const temp = kelvinToCelsius(data.main.temp);
        const feelsLike = kelvinToCelsius(data.main.feels_like);

        cityElement.textContent = `${data.name}, ${data.sys.country}`;
        dateElement.textContent = formatDate(new Date());
        temperatureElement.textContent = `${temp}°C`;
        weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        descriptionElement.textContent = data.weather[0].description;
        feelsLikeElement.textContent = `${feelsLike}°C`;
        humidityElement.textContent = `${data.main.humidity}%`;
        windSpeedElement.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    } catch (error) {
        console.error('Display issue:', error);
        handleError('Weather display failed.');
    }
}

function displayForecast(data) {
    forecastContainer.innerHTML = '';
    const dailyForecasts = processDailyForecasts(data.list);

    dailyForecasts.forEach((forecast, index) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="day">${formatDate(new Date(forecast.dt * 1000)).split(',')[0]}</div>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="Weather icon">
            <div class="temp">${kelvinToCelsius(forecast.main.temp)}°C</div>
            <div class="temp-range">${kelvinToCelsius(forecast.main.temp_min)}°C / ${kelvinToCelsius(forecast.main.temp_max)}°C</div>
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

function handleError(message) {
    errorDiv.querySelector('p').textContent = message || 'Something went wrong!';
    errorDiv.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
    weeklyForecast.classList.add('hidden');
    cityDetails.classList.add('hidden');
    loadingDiv.classList.add('hidden');
}

window.addEventListener('load', () => {
    searchInput.value = 'Delhi';
    getWeather();
});