from flask import Flask, render_template, request, redirect, jsonify
from flask_cors import CORS
import mysql.connector
import requests
import os
import sys
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Allow all origins for testing

# FlightAware API Configuration
FLIGHTAWARE_API_KEY = os.getenv('FLIGHTAWARE_API_KEY', 'CREqJuRSsur7DaGCOZvXlK64fKc7O82w')
FLIGHTAWARE_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi'

# Google Places API Configuration
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY', 'AIzaSyA4xoGAml39SJ8qzVcJHV0vOz6k1TYGL9Y')

print(f"[DEBUG] FLIGHTAWARE_API_KEY loaded: {FLIGHTAWARE_API_KEY[:10]}..." if FLIGHTAWARE_API_KEY else "[ERROR] FLIGHTAWARE_API_KEY not found!", file=sys.stderr)
print(f"[DEBUG] GOOGLE_PLACES_API_KEY loaded: {GOOGLE_PLACES_API_KEY[:10]}..." if GOOGLE_PLACES_API_KEY else "[ERROR] GOOGLE_PLACES_API_KEY not found!", file=sys.stderr)

# Database connection
def get_db_connection():
    return mysql.connector.connect(
        host="aventradb.cet2qquo45gu.us-east-1.rds.amazonaws.com",
        user="admin",
        password="Aventra2025!",
        database="aventra_db"
    )

# ==================== Original Routes ====================
@app.route('/')
def index():
    return jsonify({'message': 'Flask API running. React frontend runs on http://localhost:3000'})

@app.route('/add_user', methods=['POST'])
def add_user():
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO Users (username, email, password) VALUES (%s, %s, %s)",
                   (username, email, password))
    db.commit()
    cursor.close()
    db.close()
    return redirect('/')

@app.route('/add_trip', methods=['POST'])
def add_trip():
    user_id = request.form['user_id']
    title = request.form['title']
    description = request.form['description']
    start_date = request.form['start_date']
    end_date = request.form['end_date']
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO Trips (user_id, title, description, start_date, end_date) VALUES (%s,%s,%s,%s,%s)",
                   (user_id, title, description, start_date, end_date))
    db.commit()
    cursor.close()
    db.close()
    return redirect('/')

# ==================== HOTEL/STAYS API ROUTES ====================

@app.route('/api/hotels/search', methods=['GET'])
def search_hotels():
    """Search for hotels using Google Places API with mock data fallback"""
    location = request.args.get('location', '').strip()
    checkin = request.args.get('checkin', '').strip()
    checkout = request.args.get('checkout', '').strip()
    guests = request.args.get('guests', '1')
    
    print(f"[DEBUG] Hotel search: location={location}, checkin={checkin}, checkout={checkout}, guests={guests}", file=sys.stderr)
    
    if not location:
        return jsonify({'error': 'Location is required'}), 400
    
    # Mock hotel data as fallback
    mock_hotels = {
        'paris': [
            {'name': 'Hotel Le Bristol Paris', 'rating': 4.8, 'price': 450, 'city': 'Paris'},
            {'name': 'Shangri-La Hotel Paris', 'rating': 4.7, 'price': 520, 'city': 'Paris'},
            {'name': 'Hotel Plaza Athénée', 'rating': 4.6, 'price': 480, 'city': 'Paris'},
            {'name': 'Le Meurice', 'rating': 4.7, 'price': 500, 'city': 'Paris'},
            {'name': 'Four Seasons Hotel George V', 'rating': 4.8, 'price': 550, 'city': 'Paris'},
            {'name': 'Hotel Lutetia', 'rating': 4.5, 'price': 380, 'city': 'Paris'},
        ],
        'tokyo': [
            {'name': 'The Ritz-Carlton Tokyo', 'rating': 4.7, 'price': 420, 'city': 'Tokyo'},
            {'name': 'Aman Tokyo', 'rating': 4.8, 'price': 500, 'city': 'Tokyo'},
            {'name': 'Park Hyatt Tokyo', 'rating': 4.6, 'price': 380, 'city': 'Tokyo'},
            {'name': 'The Peninsula Tokyo', 'rating': 4.7, 'price': 450, 'city': 'Tokyo'},
            {'name': 'Mandarin Oriental Tokyo', 'rating': 4.8, 'price': 480, 'city': 'Tokyo'},
            {'name': 'Conrad Tokyo', 'rating': 4.5, 'price': 320, 'city': 'Tokyo'},
        ],
        'new york': [
            {'name': 'The Plaza Hotel', 'rating': 4.5, 'price': 500, 'city': 'New York'},
            {'name': 'The St. Regis New York', 'rating': 4.6, 'price': 550, 'city': 'New York'},
            {'name': 'The Peninsula New York', 'rating': 4.7, 'price': 520, 'city': 'New York'},
            {'name': 'Park Hyatt New York', 'rating': 4.6, 'price': 480, 'city': 'New York'},
            {'name': 'The Carlyle', 'rating': 4.7, 'price': 530, 'city': 'New York'},
            {'name': 'Mandarin Oriental New York', 'rating': 4.6, 'price': 490, 'city': 'New York'},
        ],
        'atlanta': [
            {'name': 'The St. Regis Atlanta', 'rating': 4.6, 'price': 320, 'city': 'Atlanta'},
            {'name': 'InterContinental Buckhead', 'rating': 4.4, 'price': 250, 'city': 'Atlanta'},
            {'name': 'The Whitley Atlanta', 'rating': 4.5, 'price': 280, 'city': 'Atlanta'},
            {'name': 'Four Seasons Atlanta', 'rating': 4.6, 'price': 350, 'city': 'Atlanta'},
            {'name': 'Hotel Clermont', 'rating': 4.3, 'price': 180, 'city': 'Atlanta'},
            {'name': 'The Georgian Terrace', 'rating': 4.4, 'price': 220, 'city': 'Atlanta'},
        ],
    }
    
    # Try to match location to mock data for fallback
    location_lower = location.lower()
    matched_hotels = None
    matched_city = None
    
    for city_key, hotels in mock_hotels.items():
        if city_key in location_lower:
            matched_hotels = hotels
            matched_city = hotels[0]['city']
            break
    
    # Try Google Places API first
    if GOOGLE_PLACES_API_KEY:
        try:
            geocode_url = 'https://maps.googleapis.com/maps/api/geocode/json'
            geocode_params = {
                'address': location,
                'key': GOOGLE_PLACES_API_KEY
            }
            
            print(f"[DEBUG] Geocoding location: {location}", file=sys.stderr)
            geocode_resp = requests.get(geocode_url, params=geocode_params, timeout=10)
            
            print(f"[DEBUG] Geocode HTTP status: {geocode_resp.status_code}", file=sys.stderr)
            
            if geocode_resp.status_code == 200:
                geocode_data = geocode_resp.json()
                print(f"[DEBUG] Geocode API response status: {geocode_data.get('status')}", file=sys.stderr)
                
                if geocode_data.get('status') == 'REQUEST_DENIED':
                    print(f"[ERROR] Google API REQUEST_DENIED: {geocode_data.get('error_message')}", file=sys.stderr)
                    print(f"[WARNING] Falling back to mock hotel data", file=sys.stderr)
                elif geocode_data.get('status') == 'OK' and geocode_data.get('results'):
                    lat_lng = geocode_data['results'][0]['geometry']['location']
                    formatted_address = geocode_data['results'][0].get('formatted_address', location)
                    print(f"[DEBUG] Location coordinates: {lat_lng}, formatted: {formatted_address}", file=sys.stderr)
                    
                    # Search for hotels
                    places_url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
                    places_params = {
                        'location': f"{lat_lng['lat']},{lat_lng['lng']}",
                        'radius': 10000,
                        'type': 'lodging',
                        'key': GOOGLE_PLACES_API_KEY
                    }
                    
                    print(f"[DEBUG] Searching for hotels near coordinates", file=sys.stderr)
                    places_resp = requests.get(places_url, params=places_params, timeout=10)
                    
                    if places_resp.status_code == 200:
                        places_data = places_resp.json()
                        print(f"[DEBUG] Places API status: {places_data.get('status')}", file=sys.stderr)
                        
                        if places_data.get('status') == 'OK':
                            results = []
                            for place in places_data.get('results', [])[:20]:
                                rating = place.get('rating', 3.5)
                                price_level = place.get('price_level', 2)
                                base_prices = {1: 50, 2: 100, 3: 200, 4: 350}
                                base_price = base_prices.get(price_level, 100)
                                nightly_rate = int(base_price + (rating * 20))
                                
                                photo_url = None
                                if place.get('photos'):
                                    photo_reference = place['photos'][0].get('photo_reference')
                                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={GOOGLE_PLACES_API_KEY}"
                                
                                results.append({
                                    'id': place.get('place_id'),
                                    'name': place.get('name'),
                                    'address': place.get('vicinity'),
                                    'rating': rating,
                                    'total_ratings': place.get('user_ratings_total', 0),
                                    'price_level': price_level,
                                    'nightly_rate': nightly_rate,
                                    'currency': 'USD',
                                    'photo_url': photo_url,
                                    'location': {
                                        'lat': place['geometry']['location']['lat'],
                                        'lng': place['geometry']['location']['lng']
                                    }
                                })
                            
                            if results:
                                print(f"[DEBUG] Returning {len(results)} hotels from Google Places API", file=sys.stderr)
                                return jsonify({'results': results, 'count': len(results)})
                else:
                    print(f"[WARNING] Google Geocoding returned status: {geocode_data.get('status')}", file=sys.stderr)
                    if geocode_data.get('error_message'):
                        print(f"[WARNING] Error message: {geocode_data.get('error_message')}", file=sys.stderr)
            
        except Exception as e:
            print(f"[WARNING] Google API failed, falling back to mock data: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc()
    
    # Fallback to mock data
    if matched_hotels:
        print(f"[DEBUG] Using mock hotel data for {matched_city}", file=sys.stderr)
        results = []
        for idx, hotel in enumerate(matched_hotels):
            results.append({
                'id': f"mock_{matched_city}_{idx}",
                'name': hotel['name'],
                'address': f"{matched_city} City Center",
                'rating': hotel['rating'],
                'total_ratings': 500 + (idx * 100),
                'price_level': 3 if hotel['price'] > 300 else 2,
                'nightly_rate': hotel['price'],
                'currency': 'USD',
                'photo_url': f"https://placehold.co/400x300/4A90E2/FFF?text={hotel['name'].replace(' ', '+')}",
                'location': {'lat': 0, 'lng': 0}
            })
        
        print(f"[DEBUG] Returning {len(results)} mock hotels", file=sys.stderr)
        return jsonify({'results': results, 'count': len(results)})
    
    # No mock data available
    print(f"[ERROR] No hotels found for location: {location}", file=sys.stderr)
    return jsonify({'error': f'No hotels found for "{location}". Try: Paris, Tokyo, New York, or Atlanta'}), 404


@app.route('/api/hotels/<hotel_id>', methods=['GET'])
def get_hotel_details(hotel_id):
    """Get detailed information about a specific hotel"""
    if not GOOGLE_PLACES_API_KEY:
        return jsonify({'error': 'Google Places API key not configured'}), 500
    
    try:
        details_url = 'https://maps.googleapis.com/maps/api/place/details/json'
        params = {
            'place_id': hotel_id,
            'fields': 'name,rating,formatted_phone_number,formatted_address,website,photos,reviews,price_level,opening_hours',
            'key': GOOGLE_PLACES_API_KEY
        }
        
        resp = requests.get(details_url, params=params, timeout=10)
        
        if resp.status_code != 200:
            return jsonify({'error': 'Failed to fetch hotel details'}), 502
        
        data = resp.json()
        hotel = data.get('result', {})
        
        return jsonify(hotel)
    
    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}", file=sys.stderr)
        return jsonify({'error': 'Unexpected error', 'details': str(e)}), 500


# ==================== FLIGHT API ROUTES ====================

COMMON_AIRPORTS = [
    {'code': 'ATL', 'name': 'Hartsfield-Jackson Atlanta International', 'city': 'Atlanta', 'country': 'US'},
    {'code': 'DFW', 'name': 'Dallas/Fort Worth International', 'city': 'Dallas', 'country': 'US'},
    {'code': 'ORD', 'name': "Chicago O'Hare International", 'city': 'Chicago', 'country': 'US'},
    {'code': 'MDW', 'name': 'Chicago Midway International', 'city': 'Chicago', 'country': 'US'},
    {'code': 'LAX', 'name': 'Los Angeles International', 'city': 'Los Angeles', 'country': 'US'},
    {'code': 'JFK', 'name': 'John F. Kennedy International', 'city': 'New York', 'country': 'US'},
    {'code': 'LGA', 'name': 'LaGuardia', 'city': 'New York', 'country': 'US'},
    {'code': 'MIA', 'name': 'Miami International', 'city': 'Miami', 'country': 'US'},
    {'code': 'SFO', 'name': 'San Francisco International', 'city': 'San Francisco', 'country': 'US'},
    {'code': 'SEA', 'name': 'Seattle-Tacoma International', 'city': 'Seattle', 'country': 'US'},
    {'code': 'BOS', 'name': 'Boston Logan International', 'city': 'Boston', 'country': 'US'},
    {'code': 'DEN', 'name': 'Denver International', 'city': 'Denver', 'country': 'US'},
    {'code': 'LAS', 'name': 'Harry Reid International', 'city': 'Las Vegas', 'country': 'US'},
    {'code': 'PHX', 'name': 'Phoenix Sky Harbor International', 'city': 'Phoenix', 'country': 'US'},
    {'code': 'DCA', 'name': 'Ronald Reagan Washington National', 'city': 'Washington', 'country': 'US'},
    {'code': 'IAD', 'name': 'Washington Dulles International', 'city': 'Washington', 'country': 'US'},
    {'code': 'NRT', 'name': 'Narita International', 'city': 'Tokyo', 'country': 'JP'},
    {'code': 'HND', 'name': 'Haneda Airport', 'city': 'Tokyo', 'country': 'JP'},
    {'code': 'KIX', 'name': 'Kansai International', 'city': 'Osaka', 'country': 'JP'},
    {'code': 'NGO', 'name': 'Chubu Centrair International', 'city': 'Nagoya', 'country': 'JP'},
    {'code': 'FUK', 'name': 'Fukuoka International', 'city': 'Fukuoka', 'country': 'JP'},
    {'code': 'CDG', 'name': 'Paris Charles de Gaulle', 'city': 'Paris', 'country': 'FR'},
    {'code': 'ORY', 'name': 'Paris Orly', 'city': 'Paris', 'country': 'FR'},
    {'code': 'BVA', 'name': 'Paris Beauvais', 'city': 'Beauvais', 'country': 'FR'},
]

def generate_mock_flights(origin, destination, search_date):
    flight_configs = {
        ('ATL', 'MDW'): [
            {'ident': 'AAL250', 'airline': 'American Airlines', 'depart': '08:00', 'arrive': '10:30', 'aircraft': 'Boeing 737'},
            {'ident': 'UAL432', 'airline': 'United Airlines', 'depart': '09:15', 'arrive': '11:45', 'aircraft': 'Airbus A320'},
            {'ident': 'DAL678', 'airline': 'Delta Air Lines', 'depart': '11:00', 'arrive': '13:30', 'aircraft': 'Boeing 757'},
            {'ident': 'SWA891', 'airline': 'Southwest Airlines', 'depart': '13:30', 'arrive': '16:00', 'aircraft': 'Boeing 737'},
        ],
        ('HND', 'NRT'): [
            {'ident': 'JAL101', 'airline': 'Japan Airlines', 'depart': '06:00', 'arrive': '07:15', 'aircraft': 'Airbus A350'},
            {'ident': 'ANA205', 'airline': 'All Nippon Airways', 'depart': '08:30', 'arrive': '09:45', 'aircraft': 'Boeing 787'},
        ],
        ('CDG', 'ORY'): [
            {'ident': 'AFR100', 'airline': 'Air France', 'depart': '07:00', 'arrive': '08:15', 'aircraft': 'Airbus A220'},
        ],
        ('ATL', 'CDG'): [
            {'ident': 'AAL100', 'airline': 'American Airlines', 'depart': '17:00', 'arrive': '07:30+1', 'aircraft': 'Boeing 777'},
        ],
        ('ATL', 'HND'): [
            {'ident': 'DAL285', 'airline': 'Delta Air Lines', 'depart': '13:00', 'arrive': '15:30+1', 'aircraft': 'Boeing 777'},
        ],
    }
    
    configs = flight_configs.get((origin, destination), [
        {'ident': 'FL001', 'airline': 'Mystery Airlines', 'depart': '08:00', 'arrive': '11:00', 'aircraft': 'Airbus A320'},
    ])
    
    flights = []
    for config in configs:
        flights.append({
            'ident': config['ident'],
            'operator': {'name': config['airline']},
            'origin': {'code': origin, 'name': f'{origin} Airport'},
            'destination': {'code': destination, 'name': f'{destination} Airport'},
            'scheduled_departure': f"2025-11-25T{config['depart']}:00Z",
            'scheduled_arrival': f"2025-11-25T{config['arrive'].split('+')[0]}:00Z",
            'status': 'scheduled',
            'aircraft_type': config['aircraft'],
        })
    return flights

@app.route('/api/airports/search', methods=['GET'])
def search_airports():
    query = request.args.get('q', '').strip().upper()
    if not query:
        return jsonify({'airports': []})
    
    results = []
    for airport in COMMON_AIRPORTS:
        if query in airport['code'] or query.lower() in airport['city'].lower():
            results.append({
                'code': airport['code'],
                'name': airport['name'],
                'city': airport['city'],
                'country': airport['country'],
                'full_name': f"{airport['name']} ({airport['code']})"
            })
    return jsonify({'airports': results})

@app.route('/api/flights/search', methods=['GET'])
def search_flights():
    origin = request.args.get('origin', '').strip().upper()
    destination = request.args.get('destination', '').strip().upper()
    date = request.args.get('date', '').strip()
    
    if not origin or not destination:
        return jsonify({'error': 'Invalid origin or destination'}), 400
    
    flights = generate_mock_flights(origin, destination, date)
    results = []
    for flight in flights:
        results.append({
            'flight_id': flight.get('ident'),
            'flight_number': flight.get('ident'),
            'airline_name': flight.get('operator', {}).get('name'),
            'origin_code': origin,
            'destination_code': destination,
            'origin_name': flight.get('origin', {}).get('name'),
            'destination_name': flight.get('destination', {}).get('name'),
            'departure_time': flight.get('scheduled_departure'),
            'arrival_time': flight.get('scheduled_arrival'),
            'status': flight.get('status'),
            'aircraft_type': flight.get('aircraft_type'),
        })
    return jsonify({'results': results, 'count': len(results)})

@app.route('/api/flights/<flight_id>', methods=['GET'])
def get_flight_details(flight_id):
    return jsonify({
        'id': flight_id,
        'ident': flight_id,
        'status': 'scheduled',
        'operator': {'name': 'Airline'},
        'aircraft_type': 'Boeing 737',
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
