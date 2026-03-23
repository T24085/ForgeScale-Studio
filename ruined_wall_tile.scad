$fn = 36;

// Parametric ruined wall tile sized for tabletop terrain.
tile_length = 100;
tile_depth = 50;
base_thickness = 4;

wall_length = 84;
wall_thickness = 10;
wall_height = 34;
wall_offset_y = 0;

stone_w = 12;
stone_h = 6;
joint_gap = 0.8;

edge_bevel = 1.2;
damage_depth = 4;

use_connector_sockets = true;
socket_diameter = 5.2;
socket_depth = 3;
socket_inset = 12;

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

module terrain_base() {
    difference() {
        rounded_block([tile_length, tile_depth, base_thickness], r = edge_bevel);

        if (use_connector_sockets) {
            for (x = [socket_inset, tile_length - socket_inset]) {
                translate([x, tile_depth / 2, base_thickness - socket_depth])
                    cylinder(h = socket_depth + 0.2, d = socket_diameter);
            }
        }
    }
}

module wall_core() {
    translate([
        (tile_length - wall_length) / 2,
        (tile_depth - wall_thickness) / 2 + wall_offset_y,
        base_thickness
    ])
        cube([wall_length, wall_thickness, wall_height]);
}

module stone_row(row_index = 0) {
    y = (tile_depth - wall_thickness) / 2 + wall_offset_y;
    z = base_thickness + row_index * stone_h;
    row_offset = (row_index % 2) * (stone_w / 2);
    usable_length = wall_length - row_offset;
    stone_count = floor(usable_length / stone_w);

    for (i = [0 : stone_count - 1]) {
        x = (tile_length - wall_length) / 2 + row_offset + i * stone_w;
        current_w = min(stone_w - joint_gap, tile_length - x - (tile_length - wall_length) / 2);

        if (current_w > 2) {
            translate([x + joint_gap / 2, y + joint_gap / 2, z + joint_gap / 2])
                rounded_block(
                    [
                        current_w,
                        wall_thickness - joint_gap,
                        stone_h - joint_gap
                    ],
                    r = 0.55
                );
        }
    }
}

module stone_courses() {
    row_count = floor(wall_height / stone_h);
    for (row = [0 : row_count - 1]) {
        stone_row(row);
    }
}

module break_notches() {
    wall_x = (tile_length - wall_length) / 2;
    wall_y = (tile_depth - wall_thickness) / 2 + wall_offset_y;

    translate([wall_x + wall_length - 18, wall_y - 1, base_thickness + 8])
        rotate([0, 20, -8])
        cube([22, wall_thickness + 2, wall_height], center = false);

    translate([wall_x - 4, wall_y - 1, base_thickness + 22])
        rotate([0, -18, 7])
        cube([16, wall_thickness + 2, 18], center = false);

    translate([wall_x + 34, wall_y - 1, base_thickness + 18])
        rotate([0, 12, 0])
        cube([11, wall_thickness + 2, 22], center = false);
}

module chip_cuts() {
    wall_x = (tile_length - wall_length) / 2;
    wall_y = (tile_depth - wall_thickness) / 2 + wall_offset_y;

    translate([wall_x + 10, wall_y + wall_thickness / 2, base_thickness + 12])
        rotate([0, 90, 0])
        cylinder(h = damage_depth, r1 = 0, r2 = 3.5);

    translate([wall_x + 42, wall_y + wall_thickness / 2, base_thickness + 26])
        rotate([0, -90, 0])
        cylinder(h = damage_depth, r1 = 0, r2 = 4);

    translate([wall_x + 60, wall_y + wall_thickness / 2, base_thickness + 14])
        rotate([90, 0, 0])
        cylinder(h = damage_depth, r1 = 0, r2 = 2.8);
}

module rubble_piece(pos = [0, 0, 0], size = [8, 6, 4], rot = [0, 0, 0]) {
    translate(pos)
        rotate(rot)
        rounded_block(size, r = 0.7);
}

module rubble_scatter() {
    rubble_piece([18, 12, base_thickness], [10, 8, 4], [8, 0, 22]);
    rubble_piece([28, 35, base_thickness], [7, 6, 5], [0, 10, -18]);
    rubble_piece([44, 11, base_thickness], [11, 7, 3], [15, 0, 12]);
    rubble_piece([71, 37, base_thickness], [9, 8, 4], [0, -8, 30]);
    rubble_piece([82, 14, base_thickness], [6, 5, 6], [12, 4, -15]);
}

module ruined_wall() {
    difference() {
        union() {
            wall_core();
            stone_courses();
        }
        break_notches();
        chip_cuts();
    }
}

module terrain_tile() {
    union() {
        terrain_base();
        ruined_wall();
        rubble_scatter();
    }
}

terrain_tile();
