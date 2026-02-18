import axios from 'axios';

const test = async () => {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Test User',
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            age: 25,
            monthlySalary: 50000,
            monthlyNPSContribution: 5000,
            retirementAge: 60,
            riskProfile: 'moderate',
            desiredMonthlyPension: 30000
        });
        console.log('✅ Success:', response.data);
    } catch (err) {
        console.log('❌ Error:', err.response?.status, err.response?.data);
    }
};

test();
