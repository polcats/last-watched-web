function ValidateRegistration() {
    $("#registration .help")
        .html("")
        .removeClass("is-danger");

    let username = $("input#username")[0].value;
    if (username.length < 3) {
        $("#username-help")
            .addClass("is-danger")
            .html("Must have at least 3 characters.");
        return false;
    }

    if (username.length != username.replace(/[^a-zA-Z0-9_.]/gim, "").length) {
        $("#username-help")
            .addClass("is-danger")
            .html("Only letters, numbers, and symbols (.,_) are allowed.");
        return false;
    }

    let email = $("input#email")[0].value;
    if (email.length != email.replace(/[^a-zA-Z0-9_@.]/gim, "").length) {
        $("#email-help")
            .addClass("is-danger")
            .html("Only letters, numbers, and symbols (@,.,_) are allowed.");
        return false;
    }

    let pass1 = $("input#password1")[0].value;
    let pass2 = $("input#password2")[0].value;

    if (pass1 != pass2) {
        $("#pass-help")
            .addClass("is-danger")
            .html("Passwords do not match.");
        return false;
    }

    return true;
}

function SubmitRegistration() {
    let registrationData = ValidateRegistration();
    if (!registrationData) {
        return false;
    }

    let url = $("#registration").attr("action");
    let data = $("#registration").serialize();
    console.log(data);

    let submit = $.post(url, data)
        .fail(function(resp) {
            let errorMessage = JSON.parse(resp.responseText).error;
            $("#register-help")
                .text(errorMessage)
                .addClass("is-danger");
        })
        .done(function(resp) {
            window.location.replace("/display?do=registration_success");
        });
}

$(document).ready(function() {
    $("#button-register").click(function() {
        SubmitRegistration();
    });
});
