$fn = 36;

// Fantasy terrain kit for tabletop boards.
// Set render_piece to choose a single part or "preview" for a sample layout.
render_piece = "preview"; // floor, wall, corner, doorway, rubble, pillar, preview

tile = 50;
base_thickness = 4;
floor_thickness = 3;

wall_length = 50;
wall_thickness = 8;
wall_height = 32;

stone_w = 12;
stone_h = 6;
joint_gap = 0.8;
edge_bevel = 1.1;

door_width = 18;
door_height = 24;

pillar_size = 12;
pillar_height = 42;

connector_diameter = 5.2;
connector_depth = 3;
connector_inset = 10;
use_connectors = true;

module rounded_block(size = [10, 10, 10], r = 1) {
    x = size[0];
    y = size[1];
    z = size[2];

    hull() {
        for (ix = [r, x - r]) {
            for (iy = [r, y - r]) {
                for (iz = [r, z - r]) {
                    translate([ix, iy, iz]) sphere(r = r);
                }
            }
        }
    }
}

module base_plate(size = [tile, tile, base_thickness], sockets = []) {
    difference() {
        rounded_block(size, r = edge_bevel);

        if (use_connectors) {
            for (socket = sockets) {
                translate([socket[0], socket[1], size[2] - connector_depth])
                    cylinder(h = connector_depth + 0.2, d = connector_diameter);
            }
        }
    }
}

module stone_row(length, depth, z_pos, offset = 0) {
    usable_length = length - offset;
    stone_count = floor(usable_length / stone_w);

    for (i = [0 : stone_count - 1]) {
        x = offset + i * stone_w;
        current_w = min(stone_w - joint_gap, length - x);

        if (current_w > 2) {
            translate([x + joint_gap / 2, joint_gap / 2, z_pos + joint_gap / 2])
                rounded_block(
                    [current_w, depth - joint_gap, stone_h - joint_gap],
                    r = 0.45
                );
        }
    }
}

module wall_skin(length = wall_length, depth = wall_thickness, height = wall_height) {
    row_count = floor(height / stone_h);

    union() {
        cube([length, depth, height]);

        for (row = [0 : row_count - 1]) {
            translate([0, 0, row * stone_h])
                stone_row(length, depth, 0, (row % 2) * (stone_w / 2));
        }
    }
}

module chip_cut(pos = [0, 0, 0], rot = [0, 0, 0], radius = 3.5, depth = 4) {
    translate(pos)
        rotate(rot)
        cylinder(h = depth, r1 = 0, r2 = radius);
}

module floor_tile() {
    union() {
        base_plate(
            [tile, tile, base_thickness + floor_thickness],
            [
                [connector_inset, tile / 2],
                [tile - connector_inset, tile / 2]
            ]
        );

        for (x = [6, tile / 2]) {
            for (y = [6, tile / 2]) {
                translate([x, y, base_thickness + floor_thickness - 0.6])
                    rounded_block([tile / 2 - 8, tile / 2 - 8, 1], r = 0.35);
            }
        }
    }
}

module straight_wall() {
    wall_x = 0;
    wall_y = (tile - wall_thickness) / 2;

    difference() {
        union() {
            base_plate(
                [tile, tile, base_thickness],
                [
                    [connector_inset, tile / 2],
                    [tile - connector_inset, tile / 2]
                ]
            );

            translate([wall_x, wall_y, base_thickness])
                wall_skin();
        }

        translate([wall_length - 10, wall_y - 1, base_thickness + 10])
            rotate([0, 18, -6])
            cube([14, wall_thickness + 2, wall_height + 2], center = false);

        chip_cut([10, wall_y + wall_thickness / 2, base_thickness + 13], [0, 90, 0], 3.2, 4);
        chip_cut([30, wall_y + wall_thickness / 2, base_thickness + 24], [0, -90, 0], 4.2, 4);
    }

    rubble_scatter(offset = [0, 0, 0]);
}

module corner_wall() {
    wall_y = (tile - wall_thickness) / 2;

    difference() {
        union() {
            base_plate(
                [tile, tile, base_thickness],
                [
                    [connector_inset, tile / 2],
                    [tile / 2, tile - connector_inset]
                ]
            );

            translate([0, wall_y, base_thickness])
                wall_skin(length = tile, depth = wall_thickness, height = wall_height);

            translate([wall_y, 0, base_thickness])
                rotate([0, 0, 90])
                wall_skin(length = tile, depth = wall_thickness, height = wall_height);

            translate([wall_y, wall_y, base_thickness])
                rounded_block([wall_thickness, wall_thickness, wall_height], r = 0.6);
        }

        translate([tile - 14, wall_y - 1, base_thickness + 12])
            rotate([0, 16, 0])
            cube([18, wall_thickness + 2, wall_height + 2], center = false);

        translate([wall_y - 1, tile - 14, base_thickness + 16])
            rotate([-14, 0, 0])
            cube([wall_thickness + 2, 18, wall_height], center = false);
    }

    rubble_scatter(offset = [3, 4, 0]);
}

module doorway_wall() {
    wall_y = (tile - wall_thickness) / 2;
    left_len = (wall_length - door_width) / 2;

    union() {
        base_plate(
            [tile, tile, base_thickness],
            [
                [connector_inset, tile / 2],
                [tile - connector_inset, tile / 2]
            ]
        );

        difference() {
            translate([0, wall_y, base_thickness])
                wall_skin(length = wall_length, depth = wall_thickness, height = wall_height);

            translate([(wall_length - door_width) / 2, wall_y - 1, base_thickness])
                cube([door_width, wall_thickness + 2, door_height], center = false);

            translate([(wall_length - door_width) / 2 - 2, wall_y - 1, base_thickness + door_height - 5])
                rotate([0, 0, 45])
                cube([door_width + 4, wall_thickness + 2, 8], center = false);
        }

        translate([left_len - 2, wall_y + 1.2, base_thickness + 8])
            rounded_block([4, wall_thickness - 2.4, door_height - 8], r = 0.5);

        translate([wall_length - left_len - 2, wall_y + 1.2, base_thickness + 8])
            rounded_block([4, wall_thickness - 2.4, door_height - 8], r = 0.5);
    }

    rubble_scatter(offset = [6, 2, 0]);
}

module pillar_piece() {
    union() {
        base_plate(
            [tile, tile, base_thickness],
            [
                [tile / 2, connector_inset],
                [tile / 2, tile - connector_inset]
            ]
        );

        translate([(tile - pillar_size) / 2, (tile - pillar_size) / 2, base_thickness])
            rounded_block([pillar_size, pillar_size, pillar_height], r = 1);

        for (band = [8, 18, 30]) {
            translate([(tile - pillar_size - 2) / 2, (tile - pillar_size - 2) / 2, base_thickness + band])
                rounded_block([pillar_size + 2, pillar_size + 2, 2], r = 0.5);
        }
    }
}

module rubble_piece(pos = [0, 0, 0], size = [8, 6, 4], rot = [0, 0, 0]) {
    translate(pos)
        rotate(rot)
        rounded_block(size, r = 0.65);
}

module rubble_scatter(offset = [0, 0, 0]) {
    rubble_piece(offset + [8, 11, base_thickness], [8, 6, 4], [10, 0, 18]);
    rubble_piece(offset + [18, 36, base_thickness], [7, 5, 5], [0, 14, -15]);
    rubble_piece(offset + [31, 8, base_thickness], [10, 7, 3], [15, 0, 10]);
    rubble_piece(offset + [38, 33, base_thickness], [6, 6, 5], [0, -10, 28]);
}

module rubble_only() {
    union() {
        base_plate([tile, tile, base_thickness], []);
        rubble_scatter(offset = [2, 1, 0]);

        translate([22, 18, base_thickness])
            rounded_block([14, 10, 6], r = 0.8);

        translate([32, 28, base_thickness + 3])
            rotate([0, 18, -12])
            rounded_block([10, 7, 10], r = 0.7);
    }
}

module preview_layout() {
    translate([0, 0, 0]) floor_tile();
    translate([tile + 8, 0, 0]) straight_wall();
    translate([2 * (tile + 8), 0, 0]) doorway_wall();
    translate([0, tile + 8, 0]) corner_wall();
    translate([tile + 8, tile + 8, 0]) pillar_piece();
    translate([2 * (tile + 8), tile + 8, 0]) rubble_only();
}

if (render_piece == "floor") {
    floor_tile();
} else if (render_piece == "wall") {
    straight_wall();
} else if (render_piece == "corner") {
    corner_wall();
} else if (render_piece == "doorway") {
    doorway_wall();
} else if (render_piece == "rubble") {
    rubble_only();
} else if (render_piece == "pillar") {
    pillar_piece();
} else {
    preview_layout();
}
