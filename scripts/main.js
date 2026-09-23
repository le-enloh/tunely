const arrow = document.getElementById("arrow")

// Pulsing Arrow Animation
function pulseArrow() {
    arrow.animate(
        [
            { transform: "translateY(0) scale(1)" },
            { transform: "translateY(4px) scale(1.1)" },
            { transform: "translateY(0) scale(1)" }
        ],
        {
            duration: 1000,
            iterations: Infinity
        }
    )
}

// Call the Arrow Animation
pulseArrow()





