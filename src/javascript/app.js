// A URL do seu arquivo JSON. O caminho é relativo ao arquivo HTML.
const jsonUrl = 'src/data/income.json';

// Use a API fetch para carregar o arquivo JSON.
fetch(jsonUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error('Erro ao carregar o arquivo JSON: ' + response.statusText);
    }
    return response.json();
  })
  .then(dataJson => {
    // Processamento de dados comum para todos os gráficos
    const dates = Object.keys(dataJson).sort((a, b) => new Date(a) - new Date(b));
    const allCategories = [...new Set(dates.flatMap(date => dataJson[date].map(item => item.nome)))];

    // --- CÁLCULO E EXIBIÇÃO DOS VALORES DO ÚLTIMO MÊS ---
    const lastDate = dates[dates.length - 1];
    const lastData = dataJson[lastDate];
    
    const lastTotalBruto = lastData.reduce((sum, item) => sum + item.bruto, 0);
    const lastTotalLiquido = lastData.reduce((sum, item) => sum + item.liquido, 0);
    
    // Formata os valores para moeda brasileira
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    document.getElementById('current-gross-value').textContent = formatter.format(lastTotalBruto);
    document.getElementById('current-net-value').textContent = formatter.format(lastTotalLiquido);

    // --- GRÁFICO 1: GRÁFICO DE BARRAS (SEPARADO POR CATEGORIA E TIPO) ---
    const barChartDatasets = [];
    const baseColors = ['#E4572E', '#3D619A', '#3C887E', '#C2B893', '#7A6563'];
    
    allCategories.forEach((categoryName, index) => {
      const baseColor = baseColors[index % baseColors.length];
      const colorBruto = baseColor;
      const colorLiquido = `rgba(${parseInt(baseColor.substring(1, 3), 16)}, ${parseInt(baseColor.substring(3, 5), 16)}, ${parseInt(baseColor.substring(5, 7), 16)}, 0.6)`;
      
      barChartDatasets.push({
        label: `${categoryName} (Bruto)`,
        data: dates.map(date => {
          const item = dataJson[date].find(d => d.nome === categoryName);
          return item ? item.bruto : null;
        }),
        backgroundColor: colorBruto
      });

      barChartDatasets.push({
        label: `${categoryName} (Líquido)`,
        data: dates.map(date => {
          const item = dataJson[date].find(d => d.nome === categoryName);
          return item ? item.liquido : null;
        }),
        backgroundColor: colorLiquido
      });
    });

    new Chart(document.getElementById('barChart'), {
      type: 'bar',
      data: {
        labels: dates,
        datasets: barChartDatasets
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: false },
          y: {
            stacked: false,
            beginAtZero: false,
            title: { display: true, text: 'Valor (R$)' }
          }
        },
        plugins: { tooltip: { mode: 'index', intersect: false } }
      }
    });

    // --- GRÁFICO 2: GRÁFICO DE LINHA (TOTAL BRUTO E LÍQUIDO POR DATA) ---
    const totalBrutoPorData = dates.map(date => {
      return dataJson[date].reduce((sum, item) => sum + item.bruto, 0);
    });
    
    const totalLiquidoPorData = dates.map(date => {
      return dataJson[date].reduce((sum, item) => sum + item.liquido, 0);
    });
    
    new Chart(document.getElementById('lineChart'), {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Total Bruto',
            data: totalBrutoPorData,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.5)',
            tension: 0.1
          },
          {
            label: 'Total Líquido',
            data: totalLiquidoPorData,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.5)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: 'Valor (R$)' }
          }
        }
      }
    });
    
    // --- GRÁFICO 3: RENDIMENTO POR DATA (BRUTO VS. LÍQUIDO) ---
    
    const totalBrutoDiario = dates.map(date => dataJson[date].reduce((sum, item) => sum + item.bruto, 0));
    const totalLiquidoDiario = dates.map(date => dataJson[date].reduce((sum, item) => sum + item.liquido, 0));

    const dailyGainsBruto = [];
    const dailyGainsLiquido = [];
    const dailyLabels = [];

    for (let i = 1; i < dates.length; i++) {
        const previousDayTotalBruto = totalBrutoDiario[i - 1];
        const currentDayTotalBruto = totalBrutoDiario[i];
        const previousDayTotalLiquido = totalLiquidoDiario[i - 1];
        const currentDayTotalLiquido = totalLiquidoDiario[i];
        
        dailyGainsBruto.push(currentDayTotalBruto - previousDayTotalBruto);
        dailyGainsLiquido.push(currentDayTotalLiquido - previousDayTotalLiquido);
        dailyLabels.push(dates[i]);
    }

    new Chart(document.getElementById('gainChart'), {
        type: 'bar',
        data: {
            labels: dailyLabels, 
            datasets: [
              {
                label: 'Rendimento Bruto por Data',
                data: dailyGainsBruto,
                backgroundColor: 'rgba(0, 123, 255, 0.7)'
              },
              {
                label: 'Rendimento Líquido por Data',
                data: dailyGainsLiquido,
                backgroundColor: 'rgba(40, 167, 69, 0.7)'
              }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Rendimento (R$)' }
                }
            }
        }
    });

  })
  .catch(error => {
    console.error('Houve um problema com a operação fetch:', error);
  });