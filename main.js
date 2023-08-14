// ye key apko open weather web se milega profile mai 
const API_KEY = "cbea78a25d2f348fd682f90424121416";

// 5-day forecast array 
const DAYS_OF_THE_WEEKS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
let selectedCityText;
let selectedCity;

//for search the cities name
const getCitiesUsingGeolocation = async (searchText) => {
    const respnse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid${API_KEY}`);
    // const respnse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${searchText}&appid=${API_KEY}`);
    return respnse.json();
}

const getCurrentWeatherData = async ({ lat, lon, name: city }) => {
    // const city = "gurgaon";
    // const city = "pune";

    const url = lat && lon ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric` : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    // await statement mention kuki agarbina injaar or await ke age chla gya to error dega ki response to aya hi nhi to convet kisko kru 
    const response = await fetch(url);
    // convert data into json format 
    // return in promise 
    return response.json();

}
// formate of temparature to add degree
const formatTemperature = (temp) => `${temp?.toFixed(1)}°`;//? it is check the null value its present or not
const createIconUrl = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

//current temprature
// all function fatch and add below function 
const loadCurrentForecast = ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }] }) => {
    const currentForecastElement = document.querySelector("#current-forecast");
    currentForecastElement.querySelector(".city").textContent = name;
    // currentForecastElement.querySelector(".temp").textContent = temp;
    currentForecastElement.querySelector(".temp").textContent = formatTemperature(temp);
    currentForecastElement.querySelector(".description").textContent = description;
    currentForecastElement.querySelector(".min-max-temp").textContent = `H: ${formatTemperature(temp_max)} L:${formatTemperature(temp_min)}`;
    // <h1>City Name</h1>
    //         <p class="temp">Temp</p>
    //         <p class="description">Descriptions</p>
    //         <p class="min-max-temp">High Low</p>
}

// five day forecast is in the bottoms:-


// Hourly forecast
const getHourlyForecast = async ({ name: city }) => {
    const respose = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    const data = await respose.json();
    return data.list.map(forecast => {
        const { main: { temp, temp_max, temp_min }, dt, dt_txt, weather: [{ description, icon }] } = forecast;
        return { temp, temp_max, temp_min, dt, dt_txt, description, icon }
    })
}
const loadHourlyForecast = ({ main: { temp: tempNow }, weather: [{ icon: iconNow }] }, hourlyForecast) => {
    console.log(hourlyForecast);
    const timeFormatter = Intl.DateTimeFormat("en", {
        hour12: true, hour: "numeric"
    })
    let dataFor12Hours = hourlyForecast.slice(2, 14);//12 entres because the first one is now or resent entries
    const hourlyContainer = document.querySelector(".hourly-container");
    let innerHTMLString = `
        <article>
        <h3 class="time">Now</h3>
        <img class="icon" src="${createIconUrl(iconNow)}"/>
        <p class="hourly-temp">${formatTemperature(tempNow)}</p>
        </article>`;

    for (let { temp, icon, dt_txt } of dataFor12Hours) {
        innerHTMLString += `<article>
        <h3 class="time">${timeFormatter.format(new Date(dt_txt))}</h3>
        <img class="icon" src="${createIconUrl(icon)}"/>
        <p class="hourly-temp">${formatTemperature(temp)}</p>
        </article>`;
    }
    hourlyContainer.innerHTML = innerHTMLString;
}

// 5-Day forecast:-
const calculateDayWiseForecast = (hourlyForecast) => {
    let dayWiseForecast = new Map();
    for (let forecast of hourlyForecast) {
        const [date] = forecast.dt_txt.split(" ");
        const dayOfTheWeek = DAYS_OF_THE_WEEKS[new Date(date).getDay()];
        console.log(dayOfTheWeek);
        if (dayWiseForecast.has(dayOfTheWeek)) {
            let forecastForDay = dayWiseForecast.get(dayOfTheWeek);
            forecastForDay.push(forecast);
            dayWiseForecast.set(dayOfTheWeek, forecastForDay);
        }
        else {
            dayWiseForecast.set(dayOfTheWeek, [forecast]);
        }
    }
    console.log(dayWiseForecast);
    for (let [key, value] of dayWiseForecast) {
        let temp_min = Math.min(...Array.from(value, val => val.temp_min));
        let temp_max = Math.max(...Array.from(value, val => val.temp_max));
        dayWiseForecast.set(key, { temp_min, temp_max, icon: value.find(v => v.icon).icon });
    }
    console.log(dayWiseForecast);
    return dayWiseForecast;
}
const loadFiveDayForecast = (hourlyForecast) => {
    console.log(hourlyForecast);
    const dayWiseForecast = calculateDayWiseForecast(hourlyForecast);
    const container = document.querySelector(".five-day-forecast-container");
    let dayWiseInfo = "";
    Array.from(dayWiseForecast).map(([day, { temp_max, temp_min, icon }], index) => {
        if (index < 5) {
            dayWiseInfo += `<article class="day-wise-forecast">
            <h3 class="day">${index === 0 ? "today" : day}</h3>
            <img class="icon" src="${createIconUrl(icon)}" alt="Five-Day forecast">
            <p class="min-temp">${formatTemperature(temp_min)}</p>
            <p class="max-temp">${formatTemperature(temp_max)}</p>
        </article>`;
        }
    })
    container.innerHTML = dayWiseInfo;
}

//Feels Like and Humidity parts:-
const loadFeelsLike = ({ main: { feels_like } }) => {
    let container = document.querySelector("#feels-like");
    container.querySelector(".feels-like-temp").textContent = formatTemperature(feels_like);

}
const loadHumidity = ({ main: { humidity } }) => {
    let container = document.querySelector("#humidity");
    container.querySelector(".humidity-value").textContent = `${humidity}%`;

}

//load data and remove all call and making into in a function
const loadData = async() => {
    const currentWheather = await getCurrentWeatherData(selectedCity);
    loadCurrentForecast(currentWheather)
    const hourlyForecast = await getHourlyForecast(currentWheather)
    loadHourlyForecast(currentWheather, hourlyForecast);
    loadFiveDayForecast(hourlyForecast)
    loadFeelsLike(currentWheather);
    loadHumidity(currentWheather)
}

const loadForecastUsingGeoLocation = () => {
    navigator.geolocation.getCurrentPosition(({coords})=>{
        const {latitude:lat, longitude:lon} = coords;
        selectedCity = {lat, lon};
        loadData();
    }, error=>console.log(error))
}

//search tools
function debounce(func) {
    let timer;
    return (...args) => {
        clearTimeout(timer);//clear existing timers
        //create a new time till the user is typing
        timer = setTimeout(() => {
            console.log("debounce");
            func.apply(this, args);
        }, 500);
    }
}
const onSearchChange = async (event) => {
    let { value } = event.target;
    // if (!value) {
        // selectedCity = null;
        // selectedCityText = "";
    // }
    // if (value && (selectedCityText !== value)) {
        const listOfCities = await getCitiesUsingGeolocation(value);
        let options = "";
        for(let {lat, lon, name, state, country} of listOfCities) {
            // options += ` <option data-city-details='${JSON.stringify({ lat, lon, name })}' value="${name}, ${state}, ${country}"></option>`;
            options += `<option value="${name}, ${state}, ${country}"></option>`;
        }
        document.querySelector("#cities").innerHTML = options;
        console.log((listOfCities));
    // } 
}


//change the name of the city
const hanandleCitySelection = (event) => {
    console.log("selection done");
    selectedCityText = event.target.value;
    let options = document.querySelectorAll("#cities > option");
    console.log(options);
    if (options?.length) {
        let selectedOption = Array.from(options).find(opt => opt.value === selectedCityText);
        selectedCity = JSON.parse(selectedOption.getAttribute("data-city-details"));
        console.log({ selectedCity });
        loadData();
        
    }
    
}
const debounceSearch = debounce((event) => onSearchChange(event));

//for all article or section
// call back function 
document.addEventListener("DOMContentLoaded", async () => {
    //search tool
    const searchInput = document.querySelector("#search");
    searchInput.addEventListener("input", debounceSearch);

    //change the name of the city
    searchInput.addEventListener("change", hanandleCitySelection);

    // const currentWheather = await getCurrentWeatherData();
    // loadCurrentForecast(currentWheather)
    // const hourlyForecast = await getHourlyForecast(currentWheather)
    // loadHourlyForecast(currentWheather, hourlyForecast);
    // loadFiveDayForecast(hourlyForecast)
    // loadFeelsLike(currentWheather);
    // loadHumidity(currentWheather)

    //call the function geoloaction usingi your ip address location automatically take it
    loadForecastUsingGeoLocation();
})