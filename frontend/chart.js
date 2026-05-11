// chart.js
let barChart;
let doughnutChart;

// 1. Hàm khởi tạo các biểu đồ với dữ liệu ban đầu
function initCharts(labels, data, total) {
    const ctxBar = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.split(' ').map(n => n[0]).join('')), // Viết tắt tên (NVT, TTM...)
            datasets: [{
                data: data,
                backgroundColor: ['#1A3FBF', '#BFDBFE', '#FDBA74'],
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    doughnutChart = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: ['#1A3FBF', '#BFDBFE', '#FDBA74'], borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                // Custom plugin để hiện tổng số phiếu ở giữa
                centerText: { text: total.toString() } 
            }
        }
    });
}

// 2. Hàm cập nhật dữ liệu (Real-time)
async function updateDashboard() {
    if (!contract) return;

    try {
        const [ids, names, voteCounts] = await contract.getAllCandidates();
        const votes = voteCounts.map(v => Number(v));
        const total = votes.reduce((a, b) => a + b, 0);

        // Cập nhật biểu đồ nếu đã tồn tại
        if (barChart && doughnutChart) {
            barChart.data.datasets[0].data = votes;
            barChart.update();

            doughnutChart.data.datasets[0].data = votes;
            doughnutChart.update();
            
            // Cập nhật các con số text trên giao diện
            document.getElementById('totalVotesCount').innerText = total.toLocaleString();
        } else {
            initCharts(names, votes, total);
        }
    } catch (error) {
        console.error("Lỗi cập nhật biểu đồ:", error);
    }
}

// 3. Lắng nghe sự kiện từ Blockchain
function listenToEvents() {
    if (contract) {
        contract.on("VotedEvent", (candidateId) => {
            console.log("Phát hiện lượt vote mới cho ID:", candidateId);
            updateDashboard(); // Tự động load lại dữ liệu khi có sự kiện mới
        });
    }
}

// Chạy khi trang web tải xong
window.addEventListener('load', async () => {
    const connected = await initWeb3(); // Hàm này nằm trong app.js
    if (connected) {
        await updateDashboard();
        listenToEvents();
    }
});