// Securely store sensitive data within an .env-file
require("dotenv").config();
// Http-client
const axios = require("axios").default;
// To stringify the request-bodies
const queryString = require("querystring");

// Will hold the tokens needed for authorization
let accessToken = null;
let refreshToken = null;

// Will hold the sensor values from tado
let tempSet = null;
let tempActual = null;
let humidity = null;

// Main-function
const start = () => {
  console.log("Starting MM-module tado...");

  const url = "https://auth.tado.com/oauth/token";
  const body = {
    client_id: "tado-web-app",
    grant_type: "password",
    scope: "home.user",
    username: process.env.TADO_USER,
    password: process.env.TADO_PASS,
    client_secret: process.env.TADO_SECRET,
  };

  const config = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Connection: "keep-alive",
    },
  };

  console.log("Requesting tado access tokens...\n");
  axios
    .post(url, queryString.stringify(body), config)
    .then((response) => {
      accessToken = response.data["access_token"];
      refreshToken = response.data["refresh_token"];

      // Initial temperature-fetch before entering the loops
      fetchTemperature();

      // Refresh both the access- and refresh tokens every nine minutes
      setInterval(() => {
        refreshTokens();
      }, 1000 * 60 * 9);

      // Fetch and log the current temperature every three minutes
      setInterval(() => {
        fetchTemperature();
      }, 1000 * 5);
    })
    .catch((error) => {
      console.log(error);
    });
};

const fetchTemperature = () => {
  const url = "https://my.tado.com/api/v2/homes/421651/zones/1/state";
  let config = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Connection": "keep-alive",
    },
  };

  const bearer = `Bearer ${accessToken}`;
  config.headers.Authorization = bearer;
  axios
    .get(url, config)
    .then((response) => {
      //console.log(response.data);
      tempActual = response.data.sensorDataPoints.insideTemperature.celsius;
      humidity = response.data.sensorDataPoints.humidity.percentage;
      if(response.data.setting.power === 'OFF') {
        console.log(`Tado is off.\nCurrent room temperature: ${tempActual}°C | Current humidity: ${humidity}%\n`)
      } else {
        tempSet = response.data.setting.temperature.celsius;
        console.log(`Tado is set to ${tempSet} degrees.\nCurrent room temperature: ${tempActual}°C | Current humidity: ${humidity}%\n`)
      } 
    })
    .catch((error) => {
      console.log(error);
    });
};

const refreshTokens = () => {
  const url = "https://auth.tado.com/oauth/token";
  const body = {
    grant_type: "refresh_token",
    client_id: "tado-web-app",
    refresh_token: `${refreshToken}`,
    client_id: "tado-web-app",
    scope: "home.user",
    client_secret: process.env.TADO_SECRET,
  };
  const config = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Connection": "keep-alive",
    },
  };

  axios
    .post(url, queryString.stringify(body), config)
    .then((response) => {
      accessToken = response.data["access_token"];
      refreshToken = response.data["refresh_token"];
    })
    .catch((error) => {
      console.log(error);
    });
};

start();
