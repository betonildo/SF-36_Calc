window.onload = function() {
    fsReadFile("sf36_csv", function (error, content) {
        var QuestionsAnswers = ExtractByQuestion(content);
        CalculateResultsAndShowIt(QuestionsAnswers);
    });
};

function fsReadFile(idPath, callback) {
    var fileInputElement = document.getElementById(idPath);

    fileInputElement.onchange = function(event) {
        //Retrieve the first (and only!) File from the FileList object
        var f = event.target.files[0]; 

        if (f) {
            var r = new FileReader();
            r.onload = function(fileEvent) {
                var contents = fileEvent.target.result;
                callback(false, contents);
            }
            r.readAsText(f);
        } 
        else callback("error opening the file");
    }

}

function ExtractByQuestion(text) {

    var rows = text.trim().split(/\n/g, -1);
    // delete empty header
    if (!rows[0].match(/\w+/g)) {
        delete rows[0];
    }
    
    for(var index in rows) {
        var cols = ExtractCSVColumns(rows[index]);
        rows[index] = ExtractColumnsValuesToSF36Logic(cols);
    }

    return rows;
}


function ExtractCSVColumns(row) {
 
    var cols = [];
    var strField = false;
    var currentcolcontent = "";
    for(var i = 0; i < row.length; i++) {
        
        var c = row.charAt(i);
        if (c === '\"') strField = !strField;
        else if ((c === ',' || i === row.length - 1) && !strField) {
            
            cols.push(currentcolcontent);
            currentcolcontent = "";
        }
        else currentcolcontent += c;
    }

    return cols;
}

function ExtractColumnsValuesToSF36Logic(cols) {
    var sf36 = {
        name : cols[0],
        1 : ClearValueToNumber(1, cols[1]),
        2 : ClearValueToNumber(2, cols[2]),
        3 : ClearValueToNumber(3, cols.slice(3, 13)),
        4 : ClearValueToNumber(4, cols.slice(13, 17)),
        5 : ClearValueToNumber(5, cols.slice(17, 20)),
        6 : ClearValueToNumber(6, cols[20]),
        7 : ClearValueToNumber(7, cols[21]),
        8 : ClearValueToNumber(8, cols[22]),
        9 : ClearValueToNumber(9, cols.slice(23, 32)),
        10 :ClearValueToNumber(10, cols[32]),
        11 : ClearValueToNumber(11, cols.slice(33)) // up to the end
    };

    return sf36;
}

function ClearValueToNumber(qstnum) {
    
    var value = arguments[1];
    // console.log(value);
    if (qstnum === 1) {
        var possibleValues = ["Excelente", "Muito Boa", "Boa", "Ruim", "Muito Ruim"];
        return ReturnValuesAccendingDependingOnQuestion(value, possibleValues);
    }
    else if (qstnum === 2) {
        var possibleValues = ["Muito Melhor", "Um Pouco Melhor", "Quase a Mesma", "Um Pouco Pior", "Muito Pior"];
        return ReturnValuesAccendingDependingOnQuestion(value, possibleValues);
    }
    else if (qstnum === 3) {
        var possibleValues = ["1-Sim, dificulta muito", "2-Sim, dificulta um pouco", "3-Não, não dificulta de modo algum"];        
        return forEachAnswerFromAtoZMax(value, possibleValues);
    }
    else if (qstnum === 4) {
        var possibleValues = ["Sim", "Não"];
        return forEachAnswerFromAtoZMax(value, possibleValues);
    }
    else if (qstnum === 5) {
        var possibleValues = ["1-Sim", "2-Não"];
        return forEachAnswerFromAtoZMax(value, possibleValues);
    }
    else if (qstnum === 6) {
        var possibleValues = ["De forma nenhuma", "Ligeiramente", "Moderadamente", "Bastante", "Extremamente"];
        return ReturnValuesAccendingDependingOnQuestion(value, possibleValues);
    }
    else if (qstnum === 7) {
        var possibleValues = ["Nenhuma", "Muito leve", "Leve", "Moderada", "Grave", "Muito grave"];
        return ReturnValuesAccendingDependingOnQuestion(value, possibleValues);
    }
    else if (qstnum === 8) {
        var possibleValues = ["De maneira alguma", "Um pouco", "Moderadamente", "Bastante", "Extremamente"];
        return ReturnValuesAccendingDependingOnQuestion(value, possibleValues);
    }
    else if (qstnum === 9) {
        var possibleValues = ["1- Todo Tempo", "2- A maior parte do tempo", "3- Uma boa parte do tempo", "4- Alguma parte do tempo", "5- Uma pequena parte do tempo", "6- Nunca"];
        return forEachAnswerFromAtoZMax(value, possibleValues);
    }
    else if (qstnum === 10) {
        var possibleValues = ["Todo Tempo", "A maior parte do tempo", "Alguma parte do tempo", "Uma pequena parte do tempo", "Nenhuma parte do tempo"];
        return ReturnValuesAccendingDependingOnQuestion(value, possibleValues);
    }
    else if (qstnum === 11) {
        var possibleValues = ["Definitivamente verdadeiro", "A maioria das vezes verdadeiro", "Não sei", "A maioria das vezes falso", "Definitivamente falso"];
        return forEachAnswerFromAtoZMax(value, possibleValues);
    }
}

function ReturnValuesAccendingDependingOnQuestion(value, possibleValues) {
    for(var index in possibleValues) {
        if (possibleValues[index].replace(/\s/g, "").toLowerCase() === value.replace(/\s/g, "").toLowerCase()) {
            return parseInt(index) + 1;
        }
    }

    return -1;
}

function forEachAnswerFromAtoZMax(values, possibleValues) {
    var alphabet = 'abcdefghijklmnopqrstuvwxyz';
    var obj = {};
    for(var i in values) {
        var value = ReturnValuesAccendingDependingOnQuestion(values[i], possibleValues);
        var propertyName = alphabet.charAt(i);
        Object.defineProperty(obj, propertyName, {
            value: value,
            writable: true,
            enumerable: true,
            configurable: true
        });
    }

    return obj;
}

function CalculateResultsAndShowIt(QuestionsAnswers) {
    var resultsElement = document.getElementById("results");
    resultsElement.innerHTML = "";
    var headerElement = document.getElementById("header");
    headerElement.innerHTML = "";
    var header = ["Nome", "Capacidade funcional","Limitação por aspectos físicos","Dor","Estado geral de saúde","Vitalidade","Aspectos sociais","Aspectos emocionais","Saúde mental"];
    PushToResultElement(headerElement, header);

    for(var index in QuestionsAnswers) {
        var answer = QuestionsAnswers[index];
        //console.log(answer);
        var resultRow = CalculateResult(answer);
        //console.log(resultRow);
        PushToResultElement(resultsElement, resultRow);
    }
}

function CalculateResult(answer) {
    var q = answer;

    var _1 = "Capacidade funcional";
    var _2 = "Limitação por aspectos físicos";
    var _3 = "Dor";
    var _4 = "Estado geral de saúde";
    var _5 = "Vitalidade";
    var _6 = "Aspectos sociais";
    var _7 = "Aspectos emocionais";
    var _8 = "Saúde mental";

    var result = {};

    /**
 * Valor obtido nas questões correspondentes – Limite inferior x 100 / Variação (Score Range)
     */

     result[_1] = CalcDominio( CalcQ3Q4Q5(q[3]), 10, 20);
     result[_2] = CalcDominio( CalcQ3Q4Q5(q[4]), 4, 4);
     result[_3] = CalcDominio( CalcQ7(q[7]) + CalcQ8(q[7], q[8]), 2, 10);
     result[_4] = CalcDominio( CalcQ1(q[1]) + CalcQ11(q[11]), 5, 20);
     var a9 = CalcQ9(q[9]);
     result[_5] = CalcDominio(a9.a + a9.e + a9.g + a9.i, 4, 20);
     result[_6] = CalcDominio(CalcQ6(q[6]) + CalcQ10(q[10]), 2, 8);
     console.log(result[_6]);
     result[_7] = CalcDominio(CalcQ3Q4Q5(q[5]), 3, 3);
     result[_8] = CalcDominio(a9.b + a9.c + a9.d + a9.f + a9.h, 5, 25);
     
     var numberedResult = [q['name']];
     for(var key in result) numberedResult.push(result[key]);
     return numberedResult;
}

function CalcDominio(qval, limitInfer, scoreRange) {
    return Math.ceil(((qval - limitInfer) / scoreRange) * 100);
}

function CalcQ1(a1) {
    switch(a1) {
    case 1:
        return 5.0;
        break;
    case 2:
        return 4.4;
        break;
    case 3:
        return 3.4;
        break;
    case 4:
        return 2.0;
        break;
    case 5:
        return 1.0;
        break;
    }   
}

function CalcQ3Q4Q5(a) {
    var result = 0;
    for(var key in a) result += a[key];
    return result;
}

function CalcQ6(a6) {
    return 6 - a6;
}

function CalcQ7(a7) {
    switch(a7) {
        case 1:
            return 6.0;
            break;
        case 2:
            return 5.4;
            break;
        case 3:
            return 4.2;
            break;
        case 4:
            return 3.1;
            break;
        case 5:
            return 2.0;
            break;
        case 6:
            return 1.0;
            break;
    }
}

function CalcQ8(a7, a8) {
    /**
A resposta da questão 8 depende da nota da questão 7
Se 7 = 1 e se 8 = 1, o valor da questão é (6)
Se 7 = 2 à 6 e se 8 = 1, o valor da questão é (5)
Se 7 = 2 à 6 e se 8 = 2, o valor da questão é (4)
Se 7 = 2 à 6 e se 8 = 3, o valor da questão é (3)
Se 7 = 2 à 6 e se 8 = 4, o valor da questão é (2)
Se 7 = 2 à 6 e se 8 = 3, o valor da questão é (1)
Se a questão 7 não for respondida, o escorre da questão 8 passa a ser o seguinte:
Se a resposta for (1), a pontuação será (6)
Se a resposta for (2), a pontuação será (4,75)
Se a resposta for (3), a pontuação será (3,5)
Se a resposta for (4), a pontuação será (2,25)
Se a resposta for (5), a pontuação será (1,0)

     */
    if (a7 === 1 && a8 === 1) {
        return 6;
    }
    else if (a7 >= 2 && a7 <= 6) {
        return 6 - a8;
    }
}


function CalcQ9(a9) {
/*
Nesta questão, a pontuação para os itens a, d, e ,h, deverá seguir a seguinte orientação:
Se a resposta for 1, o valor será (6)
Se a resposta for 2, o valor será (5)
Se a resposta for 3, o valor será (4)
Se a resposta for 4, o valor será (3)
Se a resposta for 5, o valor será (2)
Se a resposta for 6, o valor será (1)
Para os demais itens (b, c,f,g, i), o valor será mantido o mesmo
*/
    a9.a = 7 - a9.a;
    a9.d = 7 - a9.d;
    a9.e = 7 - a9.e;
    a9.h = 7 - a9.h;

    return a9;
}

function CalcQ10(a10) {
    return a10;
}

function CalcQ11(a11) {
    return (6 - a11.a) + (6 - a11.b) + (6 - a11.c) + (6 - a11.d);
}


function PushToResultElement(resultsElement, resultRow) {
    var resultHtml = CreateRowWithColsWithContents(resultRow);
    resultsElement.appendChild(resultHtml);
}

function CreateRowWithColsWithContents(contents) {
    var tr = document.createElement("tr");
    for(var i in contents) tr.appendChild(CreateColWithContent(contents[i]));
    return tr;
}

function CreateColWithContent(content) {
    var td = document.createElement("td");
    td.innerHTML = content;
    return td;
}