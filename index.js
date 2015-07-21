var Formulae = function (str, parent) {
    this.expression = null;
    this.variables = [];
    this.topFormula = parent || null;
    this.formulaStr = str;
    this.expression = this.parse(str);
    return this;
};
Formulae.prototype.splitFunctionParams = function (b) {
    for (var a = 0, d = "", e = [], c = 0; c < b.length; c++) {
        if ("," === b[c] && 0 === a) {
            e.push(d), d = "";
        } else {
            if ("(" === b[c]) {
                a++, d += b[c];
            } else {
                if (")" === b[c]) {
                    if (a--, d += b[c], 0 > a) {
                        throw "ERROR: Too many closing parentheses!";
                    }
                } else {
                    d += b[c];
                }
            }
        }
    }
    if (0 !== a) {
        throw "ERROR: Too many opening parentheses!";
    }
    0 < d.length && e.push(d);
    return e;
};
Formulae.prototype.cleanupInputString = function (b) {
    b = b.replace(/[\s]+/, "");
    b = b.replace(/([^A-Za-z0-9_]+|^)PI([^A-Za-z]+|$)/, "$1" + Math.PI + "$2");
    b = b.replace(/([^A-Za-z0-9_]+|^)E([^A-Za-z]+|$)/, "$1" + Math.E + "$2");
    b = b.replace(/([^A-Za-z0-9_]+|^)LN2([^A-Za-z]+|$)/, "$1" + Math.LN2 + "$2");
    b = b.replace(/([^A-Za-z0-9_]+|^)LN10([^A-Za-z]+|$)/, "$1" + Math.LN10 + "$2");
    b = b.replace(/([^A-Za-z0-9_]+|^)LOG2E([^A-Za-z]+|$)/, "$1" + Math.LOG2E + "$2");
    b = b.replace(/([^A-Za-z0-9_]+|^)LOG10E([^A-Za-z]+|$)/, "$1" + Math.LOG10E + "$2");
    b = b.replace(/([^A-Za-z0-9_]+|^)SQRT1_2([^A-Za-z]+|$)/, "$1" + Math.SQRT1_2 + "$2");
    return b = b.replace(/([^A-Za-z0-9_]+|^)SQRT2([^A-Za-z]+|$)/, "$1" + Math.SQRT2 + "$2");
};
Formulae.prototype.parse = function (b) {
    b = this.cleanupInputString(b);
    for (var a = b.length - 1, d = 0, e = 0, c = [], f = "", g = "", h = null, k = 0; d <= a;) {
        switch (e) {
        case 0:
            f = b.charAt(d);
            if (f.match(/[0-9.]/)) {
                e = "within-nr", g = "", d--;
            } else {
                if (f.match(/[\+\-\*\/\^]/)) {
                    if ("-" === f && (0 === c.length || c[c.length - 1] && "string" === typeof c[c.length - 1])) {
                        e = "within-nr";
                        g = "-";
                        break;
                    }
                    c.push(f);
                    e = 0;
                } else {
                    "(" === f ? (e = "within-parentheses", g = "", k = 0) : f.match(/[a-zA-Z]/) && (d < a && b.charAt(d + 1).match(/[a-zA-Z]/) ? (g = f, e = "within-func") : (c.push(this.createVariableEvaluator(f)), this.topFormula instanceof Formulae ? this.topFormula.registerVariable(f) : this.registerVariable(f), e = 0, g = ""));
                }
            }
            break;
        case "within-nr":
            f = b.charAt(d);
            f.match(/[0-9.]/) ? (g += f, d === a && c.push(Number(g))) : (c.push(Number(g)), g = "", e = 0, d--);
            break;
        case "within-func":
            f = b.charAt(d);
            if (f.match(/[a-zA-Z]/)) {
                g += f;
            } else {
                if ("(" === f) {
                    h = g, g = "", k = 0, e = "within-func-parentheses";
                } else {
                    throw "ERROR: Wrong character for function at position " + d;
                }
            }
            break;
        case "within-parentheses":
            ;
        case "within-func-parentheses":
            f = b.charAt(d), ")" === f ? 0 >= k ? ("within-parentheses" === e ? c.push(new Formulae(g, this)) : "within-func-parentheses" === e && (c.push(this.createFunctionEvaluator(g, h)), h = null), e = 0) : (k--, g += f) : ("(" === f && k++, g += f);
        }
        d++;
    }
    return c;
};
Formulae.prototype.registerVariable = function (b) {
    0 > this.variables.indexOf(b) && this.variables.push(b);
};
Formulae.prototype.getVariables = function () {
    return this.topFormula instanceof Formulae ? this.topFormula.variables : this.variables;
};
Formulae.prototype.evaluate = function (b) {
    var a = 0,
        d = 0,
        e = !0,
        d = [];
    if (b instanceof Array) {
        for (a = 0; a < b.length; a++) {
            d[a] = this.evaluate(b[a]);
        }
        return d;
    }
    for (var c = [], a = 0; a < this.getExpression().length; a++) {
        c.push(this.getExpression()[a]);
    }
    for (a = 0; a < c.length; a++) {
        if (d = c[a], "function" === typeof d) {
            c[a] = d(b);
        } else {
            if (d instanceof Formulae) {
                c[a] = d.evaluate(b);
            } else {
                if ("number" !== typeof d && "string" !== typeof d) {
                    throw console.error("UNKNOWN OBJECT IN EXPRESSIONS ARRAY!", d), new Exception("Unknown object in Expressions array");
                }
            }
        }
    }
    for (; e;) {
        for (e = !1, a = 0; a < c.length; a++) {
            if (d = c[a], "string" === typeof d && "^" === d) {
                if (0 === a || a === c.length - 1) {
                    throw "Wrong operator position!";
                }
                left = Number(c[a - 1]);
                right = Number(c[a + 1]);
                c[a - 1] = Math.pow(left, right);
                c.splice(a, 2);
                e = !0;
                break;
            }
        }
    }
    for (e = !0; e;) {
        for (e = !1, a = 0; a < c.length; a++) {
            if (d = c[a], "string" === typeof d && ("*" === d || "/" === d)) {
                if (0 === a || a === c.length - 1) {
                    throw "Wrong operator position!";
                }
                left = Number(c[a - 1]);
                right = Number(c[a + 1]);
                c[a - 1] = "*" === d ? left * right : left / right;
                c.splice(a, 2);
                e = !0;
                break;
            }
        }
    }
    for (e = !0; e;) {
        for (e = !1, a = 0; a < c.length; a++) {
            if (d = c[a], "string" === typeof d && ("+" === d || "-" === d)) {
                if (0 === a || a === c.length - 1) {
                    throw new Exception("Wrong operator position!");
                }
                left = Number(c[a - 1]);
                right = Number(c[a + 1]);
                c[a - 1] = "+" === d ? left + right : left - right;
                c.splice(a, 2);
                e = !0;
                break;
            }
        }
    }
    return c[0];
};
Formulae.prototype.getExpression = function () {
    return this.expression;
};
Formulae.prototype.createFunctionEvaluator = function (b, a) {
    for (var d = this.splitFunctionParams(b), e = this, c = 0; c < d.length; c++) {
        d[c] = new Formulae(d[c], e);
    }
    return function (b) {
        for (var c = [], h = 0; h < d.length; h++) {
            c.push(d[h].evaluate(b));
        }
        if (b && "function" === typeof b[a]) {
            return b[a].apply(e, c);
        }
        if ("function" === typeof e[a]) {
            return e[a].apply(e, c);
        }
        if ("function" === typeof Math[a]) {
            return Math[a].apply(e, c);
        }
        throw "Function not found: " + a;
    };
};
Formulae.prototype.createVariableEvaluator = function (b) {
    return function (a) {
        if (void 0 !== a[b]) {
            return a[b];
        }
    };
};
Formulae.calc = function (b, a) {
    a = a || {};
    return (new Formulae(b)).evaluate(a);
};
"undefined" !== typeof module && module.exports && (module.exports = Formulae);
