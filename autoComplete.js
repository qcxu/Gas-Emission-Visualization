/**
 Copyright (c) 2014 BrightPoint Consulting, Inc.

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
 */

function autocomplete(parent) {
    var _data=null,
        _delay= 0,
        _selection,
        _margin = {top: 30, right: 10, bottom: 50, left: 80},
        __width = 200,
        __height = 200,
        _placeHolder = "Search",
        _width,
        _height,
        _matches,
        _searchTerm,
        _lastSearchTerm,
        _currentIndex,
        _keys,  // all states from csv
        _selectedFunction=defaultSelected;
        _minLength = 1,
        _dataField = "dataField",   // "state"
        _labelField = "labelField";

    // parent = div#test
    _selection=d3.select(parent);

    function component() {
        //_selection.each(function (data) {

            // Select the svg element, if it exists.
            // Append div at search box position for input
            //var container = d3.select(this).select("#bp-ac").data([data]);
            var enter = _selection
                    .append("div")
                    .attr("id","bp-ac")
                    .attr("class","bp-ac")
                    .append("div")
                    .attr("class","padded-row")
                    .append("div")
                    .attr("style","bp-autocomplete-holder");

            _selection.attr("width", __width)
                .attr("height", __height);

            // Append input and onKyeUp event
            var input = enter.append("input")
                        .attr("class", "form-control")
                        .attr("placeholder",_placeHolder)
                        .attr("type","text")
                        .on("keyup",onKeyUp);

            // Append empty dropdown list
            var dropDown=enter.append("div").attr("class","bp-autocomplete-dropdown");

            var searching=dropDown.append("div").attr("class","bp-autocomplete-searching").text("Searching ...");

            hideSearching();
            hideDropDown();


            // When type in letter "a"
            function onKeyUp() {
                // _searchTerm = "a"
                _searchTerm=input.node().value;

                // e is the keyboard code
                var e=d3.event;

                // If key is not up/down arrow, enter
                if (!(e.which == 38 || e.which == 40 || e.which == 13)) {
                    if (_searchTerm == " ") {
                        console.log("show all");
                        _lastSearchTerm=_searchTerm;
                        _matches = [];
                        for (var i = 0; i < _keys.length; i++) {
                            _matches.push(_keys[i]);
                        }
                        processResults();
                        hideSearching();
                        showDropDown();
                    } else {
                        if (!_searchTerm || _searchTerm == "") {
                            //showSearching("No results");
                            hideDropDown();
                        }
                        // New term len >= 1 and new term is not the old term
                        else if (isNewSearchNeeded(_searchTerm,_lastSearchTerm)) {
                            _lastSearchTerm=_searchTerm;
                            _currentIndex=-1;
                            _results=[];
                            showSearching();
                            // Search term
                            search();
                            processResults();
                            if (_matches.length == 0) {
                                showSearching("No results");
                            }
                            else {
                                hideSearching();
                                showDropDown();
                            }

                        }
                    }
                    

                }
                else {
                    e.preventDefault();
                }
            }

            function processResults() {
                dropDown.selectAll(".bp-autocomplete-row").remove();
                var results=dropDown.selectAll(".bp-autocomplete-row").data(_matches, function (d) {
                    return d[_dataField];});
                results.enter()
                    .append("div").attr("class","bp-autocomplete-row")
                    .on("click",function (d,i) { row_onClick(d); })
                    //.append("div").attr("class","bp-autocomplete-title")
                    .html(function (d) {
                        return d[_dataField];
                        // var re = new RegExp(_searchTerm, 'i');
                        // var strPart = d[_dataField].match(re)[0];
                        // return d[_dataField].replace(re, "<span class='bp-autocomplete-highlight'>" + strPart + "</span>");
                    });

                results.exit().remove();

                //Update results

                // results.select(".bp-autocomplete-title")
                //     .html(function (d,i) {
                //         return d[_dataField];
                //         // var re = new RegExp(_searchTerm, 'i');
                //         // var strPart = _matches[i][_dataField].match(re);
                //         // if (strPart) {
                //         //     strPart = strPart[0];
                //         //     return _matches[i][_dataField].replace(re, "<span class='bp-autocomplete-highlight'>" + strPart + "</span>");
                //         // }

                //     });


            }

            function search() {
                // str = "a"
                var str=_searchTerm;
                console.log("searching on " + _searchTerm);
                console.log("-------------------");

                if (str.length >= _minLength) {
                    _matches = [];
                    for (var i = 0; i < _keys.length; i++) {
                        var match = false;
                        // Only consider words start from str
                        match = match || (_keys[i][_dataField].toLowerCase().indexOf(str.toLowerCase()) == 0);
                        if (match) {
                            _matches.push(_keys[i]);
                            //console.log("matches " + _keys[i][_dataField]);
                        }
                    }
                }
            }

            function row_onClick(d) {
                hideDropDown();
                input.node().value= d[_dataField];
                // Onselect =  alert(d.state)
                _selectedFunction(d);
            }

            // New term len >= 1 and new term is not the old term
            function isNewSearchNeeded(newTerm, oldTerm) {
                return newTerm.length >= _minLength && newTerm != oldTerm;
            }

            function hideSearching() {
                searching.style("display","none");
            }

            function hideDropDown() {
                dropDown.style("display","none");
            }

            function showSearching(value) {
                searching.style("display","block");
                searching.text(value);
            }

            function showDropDown() {
                dropDown.style("display","block");
            }

        //});
    }


    function measure() {
        _width=__width - _margin.right - _margin.left;
        _height=__height - _margin.top - _margin.bottom;
    }

    function defaultSelected(d) {
        console.log(d[_dataField] + " selected");
    }


    component.render = function() {
        measure();
        component();
        return component;
    }

    component.keys = function (_) {
        if (!arguments.length) return _keys;
        _keys = _;
        return component;
    }

    component.dataField = function (_) {
        if (!arguments.length) return _dataField;
        _dataField = _;
        return component;
    }

    component.labelField = function (_) {
        if (!arguments.length) return _labelField;
        _labelField = _;
        return component;
    }

    component.margin = function(_) {
        if (!arguments.length) return _margin;
        _margin = _;
        measure();
        return component;
    };

    component.width = function(_) {
        if (!arguments.length) return __width;
        __width = _;
        measure();
        return component;
    };

    component.height = function(_) {
        if (!arguments.length) return __height;
        __height = _;
        measure();
        return component;
    };

    component.delay = function(_) {
        if (!arguments.length) return _delay;
        _delay = _;
        return component;
    };

    component.keys = function(_) {
        if (!arguments.length) return _keys;
        _keys = _;
        return component;
    };

    component.placeHolder = function(_) {
        if (!arguments.length) return _placeHolder;
        _placeHolder = _;
        return component;
    };

    // _selectedFunction = onselect() = alert(d.state)
    component.onSelected = function(_) {
        if (!arguments.length) return _selectedFunction;
        _selectedFunction = _;
        return component;
    };



    return component;

}