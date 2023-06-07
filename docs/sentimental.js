const height = 800;
const width = 1200;
const margin = ({top: 0, right: 40, bottom: 34, left: 40});

const time = 0;

const setY = (text) => {
    if (text === "positivo") {
        return 60
    } else if (text === "neutro") {
        return 300
    } else {
        return 650
    }
}

let max_retweets = 0;

const setRound = (text) => {
    let split_valor = Math.ceil(max_retweets / 5)
    if (text === 0) {
        return 5
    } else if (text <= split_valor && text > 0) {
        return 8
    } else if (text <= (split_valor + split_valor) && text > split_valor) {
        return 11
    } else if (text <= (split_valor + split_valor + split_valor) && text > (split_valor + split_valor)) {
        return 14
    } else {
        return 16
    }
}

let colors = d3.scaleOrdinal()
    .domain(["positivo", "neutro", "negativo"])
    .range(['#388E3C', '#ffff00', '#E64A19']);

d3.select("#positivoColor").style("color", colors("positivo"));
d3.select("#negativoColor").style("color", colors("negativo"));
d3.select("#neutroColor").style("color", colors("neutro"));


let svg = d3.select("#svganchor")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

let xScale = d3.scaleLinear()
    .range([margin.left, width - margin.right]);

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.bottom) + ")");

let xLine = svg.append("line")
    .attr("stroke", "rgb(96,125,139)")
    .attr("stroke-dasharray", "1,2");

let tooltip = d3.select("#svganchor").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

let originalData = []
var totalSize = 0
var indiceBefore = 0
var indiceNow = 300
var splitPart = 0
var indiceActual = 1

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function plot() {
    d3.json("/static/DATA/dados/" + document.formulario.dadossss.value).then(function () {
        fetch('/preprocess-sentimental?file-name=' + document.formulario.dadossss.value).then((response) => {
            return response.json();
        })
        console.log("Começou o tempo de carregamento")
        alert(`Classificação iniciada com sucesso`)
        sleep(1000);
        alert(`Classificação terminada com sucesso`)
        console.log("Terminou o tempo de carregamento")
        alert(`Classificação realizada com sucesso, arquivo salvo com o nome  ${document.formulario.dadossss.value}_sentimental.json`)
    })
}

// preprocess-sentimental
function plot_sentimental() {
    d3.json("/static/DATA/dados/" + document.formulario.dadosss.value).then(function (data) {
        data = data.sort(function (x, y) {
            let segundsy = new Date(y.created_at)
            let segundsx = new Date(x.created_at)
            return segundsx - segundsy;
        })

        let dataSet = data;
        originalData = data;
        totalSize = data.length;
        splitPart = Math.ceil(totalSize / 500);
        indiceActual = 1
        indiceNow = 500
        indiceBefore = 0

        if (data.length > 500) {
            alert(`Dataset will be split into, ${splitPart} because have ${data.length} and limit support is 500`)
            redrawTime(time, indiceActual, indiceBefore, indiceNow, splitPart, totalSize);
            d3.selectAll(".scale").on("click", function () {
                const type = this.value;
                if (indiceActual < splitPart) {
                    if (type === "next") {
                        console.log("Pressionei next")
                        indiceActual = indiceActual += 1
                        console.log(indiceActual)
                        if (indiceActual <= 1) {
                            indiceActual = 0
                            indiceBefore = 0
                            indiceNow = 500
                        } else {
                            indiceBefore = indiceNow
                            indiceNow = indiceActual * 500
                        }
                    } else {
                        console.log("Pressionei previous")
                        console.log(indiceActual)
                        if (indiceActual <= 1) {
                            indiceActual = 0
                            indiceBefore = 0
                            indiceNow = 500
                        } else {
                            indiceBefore = indiceActual * 500
                            indiceNow = indiceBefore + 500
                        }
                        indiceActual = indiceActual -= 1
                    }

                    redrawTime(time, indiceActual, indiceBefore, indiceNow, splitPart, totalSize);
                } else {
                    indiceActual = splitPart - 1
                }
            });
        } else {
            alert(`Dataset completo`)
            redraw()
        }

        max_retweets = 50

        d3.selectAll("input").on("change", filter);

        function redraw() {
            svg.selectAll('.countries').remove();

            xScale = d3.scaleLinear().range([margin.left, width - margin.right])
            xScale.domain(d3.extent(dataSet, function (d) {
                return new Date(d.created_at);
            }));

            let xAxis;
            xAxis = d3.axisBottom(xScale)
                .ticks(5)
                .tickFormat(d3.timeFormat("%H:%M:%S"))

            d3.transition(svg).select(".x.axis")
                .transition()
                .duration(1000)
                .call(xAxis);

            let simulation = d3.forceSimulation(dataSet)
                .force("x", d3.forceX(function (d) {
                    return xScale(new Date(d.created_at).getTime());
                }).strength(2))
                .force("y", d3.forceY(function (d) {
                    return setY(d.emotion);
                }))
                .force("collide", d3.forceCollide(function (d) {
                    return setRound(d.retweets)
                }))
                .stop();

            for (let i = 0; i < dataSet.length; ++i) {
                simulation.tick(5);
            }

            let countriesCircles = svg.selectAll(".countries")
                .data(dataSet, function (d) {
                    return d.country
                });

            countriesCircles.exit()
                .attr("cx", 0)
                .attr("cy", 0)
                .remove();

            countriesCircles.enter()
                .append("circle")
                .attr("class", "countries")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", function (d) {
                    return setRound(d.retweets)
                })
                .attr("fill", function (d) {
                    return colors(d.emotion)
                })
                .merge(countriesCircles)
                .transition()
                .duration(2000)
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });

            d3.selectAll(".countries").on("mousemove", function (d) {
                tooltip.html(`Tweet: <strong>${d.text}</strong><br>
                          <span>Time:${d.created_at}</span><br>
                          <span>Retweets:${d.retweets}</span>
                          `)
                    .style('top', d3.event.pageY - 12 + 'px')
                    .style('left', d3.event.pageX + 25 + 'px')
                    .style("opacity", 0.9);

                xLine.attr("x1", d3.select(this).attr("cx"))
                    .attr("y1", d3.select(this).attr("cy"))
                    .attr("y2", (height - margin.bottom))
                    .attr("x2", d3.select(this).attr("cx"))
                    .attr("opacity", 1);

            }).on("mouseout", function (_) {
                tooltip.style("opacity", 0);
                xLine.attr("opacity", 0);
            });

        }

        function redrawTime(time, indiceActual, indiceBefore, indiceNow, splitPart, totalSize) {
            svg.selectAll('.countries').remove();
            if (indiceNow >= totalSize) {
                dataSet = originalData.slice(indiceBefore, totalSize)
                data = originalData.slice(indiceBefore, totalSize)
            } else {
                dataSet = originalData.slice(indiceBefore, indiceNow)
                data = originalData.slice(indiceBefore, indiceNow)
            }

            xScale = d3.scaleLinear().range([margin.left, width - margin.right])
            xScale.domain(d3.extent(dataSet, function (d) {
                return new Date(d.created_at);
            }));

            let xAxis;
            xAxis = d3.axisBottom(xScale)
                .ticks(5)
                .tickFormat(d3.timeFormat("%H:%M:%S"))

            d3.transition(svg).select(".x.axis")
                .transition()
                .duration(1000)
                .call(xAxis);

            let simulation = d3.forceSimulation(dataSet)
                .force("x", d3.forceX(function (d) {
                    return xScale(new Date(d.created_at).getTime());
                }).strength(2))
                .force("y", d3.forceY(function (d) {
                    return setY(d.emotion);
                }))
                .force("collide", d3.forceCollide(function (d) {
                    return setRound(d.retweets)
                }))
                .stop();

            for (let i = 0; i < dataSet.length; ++i) {
                simulation.tick(5);
            }

            let countriesCircles = svg.selectAll(".countries")
                .data(dataSet, function (d) {
                    return d.country
                });

            countriesCircles.exit()
                .attr("cx", 0)
                .attr("cy", 0)
                .remove();

            countriesCircles.enter()
                .append("circle")
                .attr("class", "countries")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", function (d) {
                    return setRound(d.retweets)
                })
                .attr("fill", function (d) {
                    return colors(d.emotion)
                })
                .merge(countriesCircles)
                .transition()
                .duration(2000)
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });

            d3.selectAll(".countries").on("mousemove", function (d) {
                tooltip.html(`Tweet: <strong>${d.text}</strong><br>
                  <span>Time:${d.created_at}</span><br>
                  <span>Retweets:${d.retweets}</span>
                  `)
                    .style('top', d3.event.pageY - 12 + 'px')
                    .style('left', d3.event.pageX + 25 + 'px')
                    .style("opacity", 0.9);

                xLine.attr("x1", d3.select(this).attr("cx"))
                    .attr("y1", d3.select(this).attr("cy"))
                    .attr("y2", (height - margin.bottom))
                    .attr("x2", d3.select(this).attr("cx"))
                    .attr("opacity", 1);

            }).on("mouseout", function (_) {
                tooltip.style("opacity", 0);
                xLine.attr("opacity", 0);
            });

        }

    }).catch(function (error) {
        if (error) throw error;
    });
}
