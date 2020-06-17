const MAX_EPISODE_VALUE = 9999;

let localShowLibrary = [];

function retrieveWatchList() {
    $.getJSON("/retrieve?data=watchlist").done(function(data) {
        localShowLibrary = data;
        renderShows(data);
    });
}
retrieveWatchList();

(function retrieveUserSession() {
    $.getJSON("/retrieve?data=session", function(data) {
        if (data) {
            $("span#username").text(data.name);
        } else {
            $("span#username").text("Anonymous");
        }
    });
})();

function updateEpisode(value, id, status, type = "inc") {
    if (type == "dec") {
        --value;
    } else {
        ++value;
    }

    if (value > MAX_EPISODE_VALUE || value <= 0) {
        return;
    }

    const data = "id=" + id + "&episode=" + value;
    console.log(data);
    $.ajax({
        type: "PUT",
        url: "/episode",
        data: data
    })
        .fail(function(res) {
            const errorMessage = JSON.parse(res.responseText).error;
            console.log(errorMessage);
        })
        .done(function(res) {
            retrieveWatchList();
        });
}

function createShowItem(name, id, last_update, current_episode, status) {
    let type = status.replace(" ", "").toLowerCase();
    let item = $(
        `
    <div class="column is-narrow">
        <div class="card show-card has-shadow">
            <div class="show-data has-background-info">
                <div class="show-title">
                    <i class="fas fa-edit fa-xs has-text-light edit-icon" title="Edit" onclick="editShow('` +
            id +
            `');"></i>

            <i class="fas fa-trash fa-xs has-text-light delete-icon" title="Delete" onclick="deleteShow('` +
            id +
            `');"></i>

                    <span class="show-text">` +
            name +
            `</span>
                </div>
                <div class="show-lastwatched">
                    <span class="show-text">Last updated ` +
            last_update +
            `</span>

                </div>
            </div>

            <div class="show-controls has-background-success">
                <div class="show-episode-increment" onclick="updateEpisode(` +
            current_episode +
            `, '` +
            id +
            `', '` +
            status +
            `')">
                    <i class="fa fa-angle-up"></i>
                </div>
                <div class="show-episode-current">
                    <span class="show-text">` +
            current_episode +
            `</span>
                </div>
                <div class="show-episode-decrement"  onclick="updateEpisode(` +
            current_episode +
            `, '` +
            id +
            `',
            '` +
            status +
            `',
             'dec')">
                    <i class="fa fa-angle-down"></i>
                </div>
            </div>
        </div>
    </div>`
    );
    return item;
}

function addShow() {
    openShowModal();
    updateShowModal("Add Item", "", "Ongoing", "", 1);
}

function updateShowModal(action, name, status, id, episode) {
    if ("Reset" == action) {
        $("#show-name-help").removeClass("is-danger");
        $("#add_show #action_title").text("");
        $("#add_show").trigger("reset");
        $("#add_show #show_status_ongoing").prop("checked", true);
        $("#add_show #save-show").attr("onclick", "");

        return;
    }

    if ("Add Item" == action) {
        $("#add_show #save-show").attr("onclick", "saveShow(event)");
    } else if ("Edit" == action) {
        $("#add_show #save-show").attr("onclick", "updateShow(event, '" + id + "')");
    }

    $("#add_show #action_title").text(action);
    $("#add_show #show_episode")[0].value = episode;
    $("#add_show #show_name")[0].value = name;

    if ("ongoing" == status) {
        $("#add_show #show_status_ongoing").prop("checked", true);
    } else if ("onhold" == status) {
        $("#add_show #show_status_on_hold").prop("checked", true);
    } else if ("finished" == status) {
        $("#add_show #show_status_finished").prop("checked", true);
    }
}

function validateShow() {
    let name = $("#add_show #show_name")[0].value;
    let filtered_name = name.replace(/[^a-zA-Z0-9_.?!-:;, ]/gim, "");

    if (!name.length || name.length != filtered_name.length) {
        $("#show-name-help")
            .addClass("is-danger")
            .html("Only letters, numbers, spaces, and symbols (.,_?!-:;) are allowed.");
        return false;
    }

    return true;
}

function saveShow(event) {
    event.preventDefault();

    if (!validateShow()) {
        return false;
    }

    $("button#save-show").attr("disabled", true);

    let url = "/show";
    let data = $("#add_show").serialize();

    $.post(url, data)
        .fail(function(res) {
            let errorMessage = JSON.parse(res.responseText).error;
            $("#add-show-help")
                .text(errorMessage)
                .addClass("is-danger");
        })
        .done(function(res) {
            retrieveWatchList();
            closeShowModal();
        })
        .always(function() {
            $("button#save-show").attr("disabled", false);
        });

    return false;
}

function deleteShow(id) {
    if (undefined == id) {
        return;
    }
    let data = {
        id: id
    };

    $.ajax({
        type: "DELETE",
        url: "/show",
        data: data
    })
        .fail(function(res) {
            alert("Failed to delete show.");
        })
        .done(function(res) {
            retrieveWatchList();
        });
}

function resetShowModal() {
    closeShowModal();
    updateShowModal("Reset");
}

function closeShowModal() {
    $(".modal").removeClass("is-active");
}

function openShowModal() {
    $(".modal").addClass("is-active");
}

function editShow(id, name, status, episode) {
    if (undefined == id) {
        return;
    }

    for (const item of localShowLibrary) {
        if (id === item._id) {
            updateShowModal("Edit", item.name, item.status, item._id, item.episode);
            openShowModal();
            break;
        }
    }
}

function updateShow(event, id) {
    event.preventDefault();

    if (!validateShow()) {
        return false;
    }

    $("button#save-show").attr("disabled", true);

    let url = "/shows";
    let data = $("#add_show").serialize() + "&target=watchlist&id=" + id;
    let save_type = $("#add_show input[name='status']:checked").val();

    $.ajax({
        type: "PUT",
        url: "/show",
        data: data
    })
        .fail(function(res) {
            let errorMessage = JSON.parse(res.responseText).error;
            $("#add-show-help")
                .text(errorMessage)
                .addClass("is-danger");
        })
        .done(function(res) {
            retrieveWatchList();
            resetShowModal("Reset");
        })
        .always(function() {
            $("button#save-show").attr("disabled", false);
        });
}

function renderShows(shows) {
    $.each($(".show-list"), function(index, value) {
        $(this).html("");
    });

    for (let i = 0; i < shows.length; ++i) {
        let container_selector = "." + shows[i].status + "-list";
        $(container_selector).append(createShowItem(shows[i].name, shows[i]._id, shows[i].last_update, shows[i].episode, shows[i].status));
    }
}

function switchTab(element) {
    if ($(element).hasClass("is-active")) {
        return;
    }

    $(".show-list").addClass("is-hidden");
    $("#show-tabs li.is-active").removeClass("is-active");
    $(element).addClass("is-active");

    let type = $(element)
        .children()
        .first()
        .children()
        .last()
        .html()
        .toLowerCase()
        .replace(" ", "");

    let container_selector = "." + type + "-list";
    $(container_selector).removeClass("is-hidden");
}

(function setElementEvents() {
    $("#navbar-burger").click(function() {
        $("#navbar-menu").toggleClass("is-active");
    });

    $("#button-logout").click(function() {
        $.post("/logout", {}).always(function() {
            window.location.replace("/");
        });
    });

    $("#show-reset").click(function() {
        resetShowModal();
    });

    $("#show-add").click(function() {
        resetShowModal();
        addShow();
    });

    $("#close-show-modal").click(function() {
        resetShowModal();
    });

    $("li.show-tab").click(function() {
        switchTab(this);
    });
})();

$(document).ready(function() {});
