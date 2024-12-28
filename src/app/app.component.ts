import { HttpClient } from '@angular/common/http';
import { Component, Inject, TemplateRef, ViewChild } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';

import { environment } from '../environments/environment';

//*
const API_URL = environment.API_URL;
const API_KEY = environment.API_KEY;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild('infoWindowContent', { static: true }) infoWindowContent!: TemplateRef<any>;
  title = 'map';
  latitude = 51.678418;
  longitude = 7.809007;
  center: google.maps.LatLngLiteral = { lat: 39.9334, lng: 32.8597 };
  zoom: number = 5;
  cityName: string = "";
  humidity: string = "";
  temp: string = "";
  weatherIcon: any;
  weatherDetails: any;
  newTemp: string = "";
  newHumidity: string = "";
  map: google.maps.Map | undefined;
  isPanelCollapsed = false;
  selectedCardId: string | null = null;
  previousCardId: string | null = null;
  searchText: string = '';
  filteredCities: any[] = [];
  selectedCity: any = null;
  today: Date = new Date();

  infoContent = ''; // InfoWindow içeriği için bir değişken
  private currentInfoWindow: google.maps.InfoWindow | null = null;
  private apiUrl = 'https://countriesnow.space/api/v0.1/countries/population/cities/filter';

  cities: { name: string, position: google.maps.LatLngLiteral, temp: string, humidity: string, index: number }[] = [
    { name: 'Istanbul', position: { lat: 41.0082, lng: 28.9784 }, temp: '', humidity: '', index: 0 },
    { name: 'Ankara', position: { lat: 39.9334, lng: 32.8597 }, temp: '', humidity: '', index: 1 },
    { name: 'Izmir', position: { lat: 38.4192, lng: 27.1287 }, temp: '', humidity: '', index: 2 },
    { name: 'Bursa', position: { lat: 40.1885, lng: 29.0610 }, temp: '', humidity: '', index: 3 },
    { name: 'Antalya', position: { lat: 36.8969, lng: 30.7133 }, temp: '', humidity: '', index: 4 },
    { name: 'Adana', position: { lat: 37.0000, lng: 35.3213 }, temp: '', humidity: '', index: 5 },
    { name: 'Gaziantep', position: { lat: 37.0662, lng: 37.3833 }, temp: '', humidity: '', index: 6 },
    { name: 'Konya', position: { lat: 37.8667, lng: 32.4833 }, temp: '', humidity: '', index: 7 },
    { name: 'Mersin', position: { lat: 36.8000, lng: 34.6333 }, temp: '', humidity: '', index: 8 },
    { name: 'Diyarbakır', position: { lat: 37.9144, lng: 40.2306 }, temp: '', humidity: '', index: 9 },
    { name: 'Eskişehir', position: { lat: 39.7767, lng: 30.5206 }, temp: '', humidity: '', index: 10 },
    { name: 'Samsun', position: { lat: 41.2867, lng: 36.3300 }, temp: '', humidity: '', index: 11 },
    { name: 'Denizli', position: { lat: 37.7765, lng: 29.0864 }, temp: '', humidity: '', index: 12 },
    { name: 'Şanlıurfa', position: { lat: 37.1591, lng: 38.7969 }, temp: '', humidity: '', index: 13 },
    { name: 'Malatya', position: { lat: 38.3552, lng: 38.3095 }, temp: '', humidity: '', index: 14 },
    { name: 'Kayseri', position: { lat: 38.7312, lng: 35.4787 }, temp: '', humidity: '', index: 15 },
    { name: 'Trabzon', position: { lat: 41.0027, lng: 39.7167 }, temp: '', humidity: '', index: 16 },
    { name: 'Van', position: { lat: 38.4891, lng: 43.4089 }, temp: '', humidity: '', index: 16 },
    { name: 'Erzurum', position: { lat: 39.9000, lng: 41.2700 }, temp: '', humidity: '', index: 17 },
    { name: 'Tekirdağ', position: { lat: 40.9833, lng: 27.5167 }, temp: '', humidity: '', index: 18 }
  ];






  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.today = new Date();
    this.initializeCitiesPanel();
  }



  ngOnInit() {
    this.getUserLocation();
    this.filteredCities = [...this.cities];

  }

  onCardClick(city: any) {
    if (this.selectedCardId === city.name) {
      this.selectedCardId = null;
      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
        this.currentInfoWindow = null;
      }
    } else {
      this.selectedCardId = city.name;
      this.onCityClick(city);
    }

  }

  onSearch() {
    if (!this.searchText) {
      this.filteredCities = [...this.cities];
      return;
    }

    this.filteredCities = this.cities.filter(city =>
      city.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
      (city.name.includes(this.searchText))
    );
  }


  togglePanel() {
    this.isPanelCollapsed = !this.isPanelCollapsed;
    const panel = document.querySelector('.panel');
    if (panel) {
      if (this.isPanelCollapsed) {
        panel.classList.add('collapsed');
      } else {
        panel.classList.remove('collapsed');
      }
    }
  }


  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Kullanıcı konumunu ayarla
          this.center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        },
        (error) => {
          console.error('Konum alınamadı:', error);
        }
      );
    } else {
      console.error('Tarayıcı konum özelliğini desteklemiyor.');
    }
  }

  onMapInitialized(map: google.maps.Map) {
    this.map = map;

    // Add click listener to the map
    google.maps.event.addListener(this.map, 'click', () => {
      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
        this.currentInfoWindow = null;
      }
    });
  }



  updateTemp() {
    this.temp = this.newTemp;
    this.loadData();
  }

  updateHumidity() {
    this.humidity = this.newHumidity;
    this.loadData();
  }

  async onCityClick(city: { name: string; position: google.maps.LatLngLiteral }) {

    this.selectedCardId = city.name;
    setTimeout(() => {
      const card = document.querySelector(`[data-city="${city.name}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    this.selectedCity = city;
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
      this.currentInfoWindow = null;
    }
    this.newTemp = "";
    this.cityName = city.name;

    // Wait for loadData to complete
    try {
      await this.loadData();  // Make sure loadData returns a Promise

      // Only create and open InfoWindow after data is loaded
      const container = document.createElement('div');
      const templateContent = this.infoWindowContent.createEmbeddedView({});
      templateContent.detectChanges();

      templateContent.rootNodes.forEach(node => {
        container.appendChild(node);
      });

      this.currentInfoWindow = new google.maps.InfoWindow({
        content: container,
        position: city.position,
      });

      this.currentInfoWindow.open(this.map);

      google.maps.event.addListenerOnce(this.currentInfoWindow, 'domready', () => {
        // Temperature button click handler
        const tempButton = document.getElementById('tempButton');
        if (tempButton) {
          tempButton.addEventListener('click', () => {
            const dialog = document.getElementById('tempDialog');
            if (dialog) {
              dialog.style.display = 'block';
            }
          });
        }

        const humidityButton = document.getElementById('humidityButton');
        if (humidityButton) {
          humidityButton.addEventListener('click', () => {
            const dialog = document.getElementById('humidityDialog');
            if (dialog) {
              dialog.style.display = 'block';
            }
          });
        }

        const updateBtnHumidity = document.querySelector('.update-btn-humidity');
        if (updateBtnHumidity) {
          updateBtnHumidity.addEventListener('click', async () => {
            try {
              if (this.selectedCity) {
                // Update only the selected city's humidity
                this.selectedCity.humidity = this.newHumidity.toString();

                // Update the displays
                const humidityDisplay = document.querySelectorAll('.temp-value')[1];
                if (humidityDisplay) {
                  humidityDisplay.textContent = `% ${this.selectedCity.humidity}`;
                }

                // Update the card display for the selected city
                const selectedCard = document.querySelector(`.sensor-card[data-city="${this.selectedCity.name}"] .humidity .value`);
                if (selectedCard) {
                  selectedCard.textContent = `% ${this.selectedCity.humidity}`;
                }

                // Visual feedback
                const updateBtn = document.querySelector('.update-btn-humidity') as HTMLButtonElement;
                if (updateBtn) {
                  const originalText = updateBtn.textContent;
                  updateBtn.textContent = 'Güncellendi!';
                  updateBtn.style.backgroundColor = '#28a745';

                  setTimeout(() => {
                    updateBtn.textContent = originalText;
                    updateBtn.style.backgroundColor = '#007bff';
                  }, 1000);
                }
              }
            } catch (error) {
              console.error('Error updating humidity:', error);
            }
          });
        }

        const cancelBtnHum = document.querySelector('.cancel-btn-humidity');
        if (cancelBtnHum) {
          cancelBtnHum.addEventListener('click', () => {
            const dialog = document.getElementById('humidityDialog');
            if (dialog) {
              dialog.style.display = 'none';
            }
          });
        }

        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            const dialog = document.getElementById('tempDialog');
            if (dialog) {
              dialog.style.display = 'none';
            }
          });
        }

        // Update button click handler
        const updateBtn = document.querySelector('.update-btn');
        if (updateBtn) {
          updateBtn.addEventListener('click', async () => {
            try {
              if (this.selectedCity) {
                // Update only the selected city's temperature
                this.selectedCity.temp = this.newTemp.toString();

                // Update the displays
                const currentTempDisplay = document.querySelector('.temp-value');
                if (currentTempDisplay) {
                  currentTempDisplay.textContent = `${this.selectedCity.temp} °C`;
                }

                // Update the card display for the selected city
                const selectedCard = document.querySelector(`.sensor-card[data-city="${this.selectedCity.name}"] .temperature .value`);
                if (selectedCard) {
                  selectedCard.textContent = `${this.selectedCity.temp} °C`;
                }

                // Visual feedback
                const updateBtn = document.querySelector('.update-btn') as HTMLButtonElement;
                if (updateBtn) {
                  const originalText = updateBtn.textContent;
                  updateBtn.textContent = 'Güncellendi!';
                  updateBtn.style.backgroundColor = '#28a745';

                  setTimeout(() => {
                    updateBtn.textContent = originalText;
                    updateBtn.style.backgroundColor = '#007bff';
                  }, 1000);
                }
              }
            } catch (error) {
              console.error('Error updating temperature:', error);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  showTempDialog(cityName: string, currentTemp: number) {
    const dialog = document.getElementById('tempDialog');
    if (dialog) {
      dialog.style.display = 'block';
    }
  }

  showHumidityDialog(cityName: string, currentHumidity: number) {
    const dialog = document.getElementById('humidityDialog');
    if (dialog) {
      dialog.style.display = 'block';
    }
  }

  loadData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get(`${API_URL}/weather?q=${this.cityName}&appid=${API_KEY}`).subscribe({
        next: (results: any) => {
          console.log(results);

          if (this.newTemp == "") {
            this.temp = (results.main.temp - 273.15).toFixed(1);
          }

          if (this.newHumidity == "") {
            this.humidity = results.main.humidity;
          }

          this.weatherDetails = results.weather[0];
          this.weatherIcon = `https://openweathermap.org/img/wn/${this.weatherDetails.icon}@4x.png`;
          resolve();
        },
        error: (error) => {
          console.error('Error:', error);
          reject(error);
        }
      });
    });
  }

  async initializeCitiesPanel(): Promise<void> {
    try {
      // API çağrıları için tüm şehirler üzerinden döngü
      const weatherPromises = this.cities.map(city =>
        this.http.get(`${API_URL}/weather?q=${city.name},TR&appid=${API_KEY}`).toPromise()
      );

      // Tüm API çağrılarının tamamlanmasını bekleyin
      const results = await Promise.all(weatherPromises);

      // Şehirleri güncelle
      results.forEach((result: any, index) => {
        if (result && result.main) {
          // cities dizisindeki ilgili şehri güncelle
          this.cities[index].temp = (result.main.temp - 273.15).toFixed(1);
          this.cities[index].humidity = result.main.humidity.toString();
        }
      });

      console.log('Updated cities:', this.cities);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  }


}
