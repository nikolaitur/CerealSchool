    // insert mobile banner
    var adminBanner = document.getElementsByClassName('admin-notice')[0];
    adminBanner.insertAdjacentHTML('beforebegin', '<div class="flash-banner mobile hidden">Flash Sale! Use code <span class="discount-code">SECRET</span> in next <span class="countdown"></span> (today only!)</div>');
    var mobileFlashMessageSection = document.getElementsByClassName('flash-banner desktop')[0];
    // insert desktop banner
    var emailSection = document.getElementById('contact-information');
    emailSection.insertAdjacentHTML('beforebegin', '<div class="flash-banner desktop hidden">Flash Sale! Use code <span class="discount-code">SECRET</span> in next <span class="countdown"></span> (today only!)</div>');
    var desktopFlashMessageSection = document.getElementsByClassName('flash-banner desktop')[0];

    function setBannerCountdown(endDate) {
        $('.countdown').countdown(endDate, function(event) {
        $(this).html(event.strftime('%M:%S'));
        })
        .on('finish.countdown', function() {
        clearBannerCountdown();
        })
        $('.flash-banner').removeClass('hidden');        
    }

    function clearBannerCountdown() {
        $('.flash-banner').addClass('hidden').html('').hide();
    }


    function loadScript(url, callback) {
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        script.onreadystatechange = callback;
        script.onload = callback;

        head.appendChild(script);
    }

    var urlParams = new URLSearchParams(window.location.search);
    var endDate = new Date(atob(urlParams.get('flashSale')));

    if (endDate > new Date()) {
    loadScript("//cdn.jsdelivr.net/npm/jquery-countdown@2.2.0/dist/jquery.countdown.min.js", function() {
        setBannerCountdown(endDate);
    });
    console.log('loading banner');
    } else {
    //hide banner
    clearBannerCountdown();
    console.log('unloading banner');
    }
