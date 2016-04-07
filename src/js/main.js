'use strict';

function PiChart(data,options,google) {

  if (typeof data !== 'object' || typeof data === undefined) {
    console.log('PiChart not set data');
    return;
  } else if (data.length === 0) {
    console.log('PiChart set data length 0');
    return;
  }

  if (typeof options === 'undefined') {
    options = {};
  }

  var chartSelector = options.selector ? options.selector : 'piechart';

  var table =  new google.visualization.DataTable({
    cols : [
      {id: 'name', label: 'Name', type: 'string' },
      {id: 'value', label: 'Value', type: 'number'}
    ]
  });
  table.addRows(data);

  var chartContainer = document.getElementById(chartSelector);

  if (chartContainer === undefined) {
      console.log('piChart not finde selector = ' + chartSelector);
      return;
    }

  var chart = new google.visualization.PieChart(chartContainer);

  var drawOption = {
      //title: 'Classifications',
      legend: 'none',
      pieSliceText: 'label',
      width: '100%',
      height: '100%',
      chartArea: {
        left: "3%",
        top: "3%",
        height: "94%",
        width: "94%"
      }
    };

  if (typeof options.option !== undefined) {
      drawOption = mergeObjects(drawOption,options.option);
    }

  chart.draw(table, drawOption);
}

function getCharCounts(s) {
  var letters = {};
  s.replace(/([a-z])/gmi, function(l) {
    l = l.toLowerCase();
    letters[l] = (isNaN(letters[l]) ? 1 : ++letters[l]);
  });
  return letters;
}

function getArrayObject(obj) {
  var arr = [];
  if (typeof obj === 'object') {
    for (var prop in obj) {
      arr.push([prop,obj[prop]]);
    }
  }
  return arr.sort();
}

function mergeObjects(obj1,obj2){
  var obj3 = {};
  for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
  for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
  return obj3;
}

var googlePi = undefined;
function getStat(str) {
  var piDataObject  = getCharCounts(str);
  var piData        = getArrayObject(piDataObject);
  if(googlePi === undefined) {
    google.charts.load('current', {packages: ['corechart']});
    google.charts.setOnLoadCallback(function() {
      googlePi = google;
      PiChart(piData,{},google);
    });
  } else {
    PiChart(piData,{},googlePi);
    onResize(function() {
      PiChart(piData,{},googlePi);
    })();
  }
}

function onResize(c,t) {
  onresize = function() {
    clearTimeout(t);
    t = setTimeout(c,100)
  };
  return c
}

function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);
  });
}

function rowTpl(id,text) {
    return '<tr><td><span class="load-rss btn btn-default btn-xs" data-id="' + id + '">' + text + '</span>' +
        '<button type="button" class="btn btn-danger btn-xs pull-right delete">' +
        '<span class="glyphicon glyphicon glyphicon-remove"></span></button></td></tr>';
}

function rendRssList() {
    if(localStorage.getItem('rss-list')===null) {
        localStorage.pushObject('rss-list', 'http://www.sti.nasa.gov/scan/rss99-01.xml');
        localStorage.pushObject('rss-list', 'https://habrahabr.ru/rss/interesting/');
    }
    var rssList = localStorage.getObject('rss-list'),
        table   = $('#table-tr-rss');

    for (var key in rssList) {
        table.append(rowTpl(key,rssList[key]));
    }
}

function setErrorMessage(error) {
  $('.error-message').html(error);
  setTimeout(function() {
      $('.error-message').html('');
  },5000);
}

function clearPreviosState() {
    $('#piechart, #full-text, #rss-list, #stat').html('');
    $('#table-tr-rss td').removeClass('active');
}

Storage.prototype.setObject = function(key, obj) {
  return this.setItem(key, JSON.stringify(obj));
}
Storage.prototype.deleteObject = function(store, id) {
    var value = localStorage.getObject(store) || {};
    delete value[id];
    this.setObject(store, value);
}
Storage.prototype.getObject = function(key) {
  var value = this.getItem(key) || null;
  return JSON.parse(value);
}
Storage.prototype.getObjectKey = function(store, key) {
  var value = this.getObject(store) || {};
  return value[key] || null;
}
Storage.prototype.pushObject = function(key, obj) {
  var value = localStorage.getObject(key) || {},
      id = uid();
  value[id] = obj;
  this.setItem(key, JSON.stringify(value));
  return id;
}

$(document).on('click', '.rss-item-stat', function(event) {
  var str = $(this).parent('.rss-item').children('p.text').html();
  getStat(str);
  $('#full-text').html(str);
});

$(document).on('click', 'table#table-tr-rss .delete', function(event) {
  var td = $(this).closest('td'),
      id = td.children('span.load-rss').attr('data-id');
  localStorage.deleteObject('rss-list', id);
  td.remove();
  clearPreviosState();
});

$('#form-add-rss').on('submit', function(event) {
  event.preventDefault();
  var form = $(this),
      input = form.find('input#input-link'),
      inputValue = input.val();

  $('.error', form).html('');
  $(':submit', form).button('loading');

  if (inputValue.length >= 5) {
    var addId = localStorage.pushObject('rss-list',inputValue);
    $('#table-tr-rss').append(rowTpl(addId,inputValue));
  } else {
    $('.error', form).html('link empty or length < 5');
  }

  input.val('');

  $(':submit', form).button('reset');
});

$(document).on('click', 'table#table-tr-rss .load-rss', function(event) {
    var id   = $(this).attr('data-id'),
        link = localStorage.getObjectKey('rss-list', id),
        td   = $(this).closest('td');
    if(link !== null) {
        clearPreviosState();
        $.getJSON('/rss', { url: link }, function(data) {
            td.addClass('active');
            $('#stat').html('<b>rss message:</b> ' + data.stat.message + ' | <b>rss author:</b> ' + data.stat.author);
            $.each(data.items, function(index, element) {
                $('#rss-list').append(
                    '<div class="col-sm-12 rss-item" id="rss-item-' + index + '">' +
                    '<h5>' + element.title + '</h5>' +
                    '<div><b>author:</b>' + (element.author || '') + '</div>' +
                    '<div><b>pubDate:</b>' + element.pubDate + '</div>' +
                    '<p class="text hidden">' + element.content + '</p>' +
                    '<bottom class="btn btn-default rss-item-stat">read</bottom>' +
                    '<a href="' + element.link + '" class="btn btn-success"' +
                    ' target="_blank">full</a>' +
                    '</div>'
                );
            });
        })
        .done(function() {
            console.log( "second success" );
        })
        .fail(function(err) {
            setErrorMessage('Error get rss feeds');
            console.error(link+'='+err.status + ' ' + err.statusText);
        })
        .always(function() {
            console.log( "complete" );
        });
    } else {
        console.log('error');
    }

});

$( document ).ajaxStart(function() {
    $( "#loading" ).show();
}).ajaxStop(function() {
    $( "#loading" ).hide();
});

$(function() {
    rendRssList();
});
