
var map;
var marker;
var infowindow;

String.prototype.format = function() {
  var str = this;
  for (var i = 0; i < arguments.length; i++) {       
    var reg = new RegExp("\\{" + i + "\\}", "gm");             
    str = str.replace(reg, arguments[i]);
  }
  return str;
}


function locate_address_from_coords(lat, lng, callback) {
  var geocode_url_template = "http://maps.googleapis.com/maps/api/geocode/json?latlng={0},{1}&sensor=true&language=iw&country=IL"
  var geocode_url          = geocode_url_template.format(lat, lng);

  $.get({
        type: 'GET',
        url: geocode_url,
        dataType: 'json',
        success: function(response) {
    if (response.status != "OK") { 
      callback(undefined);
      return; 
    }

    results = response.results;

    var street_address = "";
    for (result in results) {
      if (results[result].types.includes("street_address")) {
          street_address = results[result];
      }
    }

    if (street_address != "") {
      callback(street_address);
    } else {
      callback(undefined);
    }
  }});
}

function locate_coords_from_address(address, callback) {
  var geocode_url_template = "https://maps.googleapis.com/maps/api/geocode/json?address={0}+{1}+{2}&key=AIzaSyCBZIpQRYPSPLdJ5vf0TA3pKJaLa1JsCxo&language=iw&country=IL"
  var geocode_url          = geocode_url_template.format(address.street, address.house_number, address.city);

  $.get({
        type: 'GET',
        url: geocode_url,
        dataType: 'json',
        success: function(response) {
    if (response.status != "OK") { 
      callback(undefined);
      return; 
    }

    var first_result = response.results[0];
    var location     = first_result.geometry.location

    debugger;
    if (location.partial_match) {
      console.log("couldn't find exact location");

      alert("couldn't find address");
      callback(undefined);
    } else {
      callback(location.lat, location.lng);
    }
  }});
}

function locate_zipcode_from_address(address) {
  $.ajax({
          type: 'POST',
          url: '/locate',
          data: { city: address.city, street: address.street, house_number: address.house_number },
          dataType: 'json',
          success: function(resp) {
            var zipcode = resp.zipcode;

            if (zipcode != undefined) {
              var contentString = '<div id="content">' +
              '<div id="bodyContent" class="text-center">'+
              '<p>המיקוד עבור הכתובת ' + address.street + " " + address.house_number + " " + address.city + " הוא</p>" +
              '<button class="zipcode-btn" data-clipboard-text="' + zipcode +'" title="הועתק!" data-trigger="click" data-placement="bottom">' + zipcode + '</button>'
              '</div>'+
              '</div>';

              infowindow = new google.maps.InfoWindow({
                content: contentString
              });

              infowindow.open(map, marker);
            }
          }
        });
}

function get_current_address() {
  return {
    street:       $("#address_street").val(),
    house_number: $("#address_house_number").val(),
    city:         $("#address_city").val()
  };
}

function refresh_zipcode() {
  if (infowindow) {
    infowindow.close();
  }

  if (marker) {
    marker.setMap(null);
  }

  address = get_current_address();
  locate_coords_from_address(address, function(lat, lng) {
    if (lat && lng) {
      refresh_coords(lat, lng);
    }
  });
  
  locate_zipcode_from_address(address); 
}

function refresh_coords(lat, lng) {
  var position_data = {
      lat: lat,
      lng: lng
    };

    map.setCenter(position_data);
    marker = new google.maps.Marker({
      position: position_data,
      map: map
    });
}

window.onload = function() {
  var startPos;
  var geoOptions = {
    enableHighAccuracy: true
  }

  var geoSuccess = function(position) {
    refresh_coords(position.coords.latitude, position.coords.longitude)
    locate_address_from_coords(position.coords.latitude, position.coords.longitude, function(address) {
      if (address != undefined) {
        city         = address.address_components[2].long_name
        street       = address.address_components[1].long_name
        house_number = address.address_components[0].long_name

        $("#address_street").val(street);
        $("#address_house_number").val(house_number);
        $("#address_city").val(city);

        var address = get_current_address();
        locate_zipcode_from_address(address);
      }
    });
  };

  var geoError = function(error) {
    console.log('Error occurred. Error code: ' + error.code);
  };

  if (navigator.geolocation) {
    console.log('Geolocation is supported!');

    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
  }
  else {
    console.log('Geolocation is not supported for this Browser.');
  }
};

$(document).ready(function() {
  var clipboard = new Clipboard('.zipcode-btn');

  clipboard.on('success', function(e) {
    $(".zipcode-btn").tooltip("show");

    e.clearSelection();
  });  

  $(".search-form").submit(function(event) {
    refresh_zipcode();

    event.preventDefault();
  });

  // $(".address-component").each(function(index) {
  //   $(this).focus(function() {
  //       $(this).data('originalValue', this.value);
  //   });

  //   $(this).blur(function(){
  //       var original = $(this).data('originalValue');

  //       if (original !== this.value){
  //           refresh_zipcode();
  //       }
  //   });
  // });
});

function initMap() {
    var options = {
        fullscreenControl: false,
        panControl: false,
        zoomControl: false,
        scaleControl: false,
        streetViewControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        zoom: 15
    };

    map = new google.maps.Map(document.getElementById('map-holder'), options);
}