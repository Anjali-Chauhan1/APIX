# NPS Retirement Copilot

An AI-powered retirement planning application for India's National Pension System (NPS). Get personalized retirement projections, pension simulations, and smart insights to secure your financial future.

## Features

- **User Authentication** - Secure signup/login with profile management
- **Retirement Projections** - Calculate expected corpus based on your contributions
- **Pension Simulator** - See how different scenarios affect your retirement income
- **Risk Profile Analysis** - Conservative, Moderate, or Aggressive investment strategies
- **AI Coach** - Get personalized retirement planning advice
- **Interactive Dashboard** - Visualize your retirement roadmap with charts
- **Scenario Planning** - Compare different retirement strategies

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts for data visualization
- Zustand for state management
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO for real-time updates
- OpenAI integration for AI coaching

## Project Structure

```
nps-retirement-copilot/
├── frontend/               
│   ├── src/
│   │   ├── components/     
│   │   ├── pages/          
│   │   ├── services/       
│   │   ├── store/          
│   │   └── utils/          
│   ├── package.json        
│   └── vite.config.js      
│
├── backend/               
│   ├── controllers/       
│   ├── middlewares/        
│   ├── models/             
│   ├── routes/            
│   ├── services/          
│   └── server.js           
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (optional - app works in demo mode without it)
- OpenAI API key (optional - for AI coaching features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Anjali-Chauhan1/APIX
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Create environment file (optional):
```bash

VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

4. Create backend environment file (optional):
```bash

PORT=5000
MONGODB_URI=mongodb://localhost:27017/nps-copilot
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
```

### Running the Application

**Start Frontend (Development):**
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

**Start Backend:**
```bash
cd frontend
npm run server:dev
```
Backend runs at: http://localhost:5000

## License

ISC

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
