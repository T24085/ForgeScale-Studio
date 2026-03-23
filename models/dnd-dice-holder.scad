// D&D Dice Holder
// A themed dice holder for Dungeons & Dragons with decorative elements

// Dimensions
holder_width = 100;
holder_depth = 60;
holder_height = 40;

// Dice compartment dimensions
compartment_width = 20;
compartment_depth = 20;
compartment_height = 15;

// Wall thickness
wall_thickness = 3;

// Number of compartments
num_compartments = 4;

// Main dice holder body
module dice_holder() {
    difference() {
        // Outer dimensions
        cube([holder_width, holder_depth, holder_height]);
        
        // Inner hollow space
        translate([wall_thickness, wall_thickness, wall_thickness]) {
            cube([
                holder_width - 2*wall_thickness,
                holder_depth - 2*wall_thickness,
                holder_height - wall_thickness
            ]);
        }
        
        // Dice compartments
        for (i = [0:num_compartments-1]) {
            translate([
                wall_thickness + i*(compartment_width + 5),
                wall_thickness + 10,
                wall_thickness
            ]) {
                cube([compartment_width, compartment_depth, compartment_height]);
            }
        }
    }
}

// D&D themed nameplate
module nameplate() {
    translate([holder_width/2 - 40, holder_depth - 15, holder_height - 2]) {
        linear_extrude(height = 2) {
            text("D&D", font = "Arial:style=Bold", size = 12, halign = "center", valign = "center");
        }
    }
}

// Decorative elements - dragon scales pattern
module dragon_scales() {
    for (i = [0:3]) {
        for (j = [0:4]) {
            translate([10 + i*20, 10 + j*15, holder_height - 1]) {
                circle(r = 2);
            }
        }
    }
}

// Main assembly
union() {
    dice_holder();
    nameplate();
    dragon_scales();
}

// Optional: Add a base for stability
translate([0, 0, -5]) {
    cube([holder_width, holder_depth, 5]);
}
