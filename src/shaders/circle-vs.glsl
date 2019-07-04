attribute vec4 a_packed_data;
attribute vec4 a_packed_data2;
attribute vec4 a_packed_data3;

uniform mat4 u_matrix;
uniform vec2 u_extrude_scale;

varying vec4 v_color;
varying vec4 v_stroke_color;
varying vec4 v_data;
varying vec4 v_data2;

#pragma include "common"
#pragma include "decode"
#define DEVICE_PIXEL_RATIO 1.0

void main() {
    // unpack color(vec2)
    v_color = decode_color(a_packed_data.xy);
    v_stroke_color = decode_color(a_packed_data2.xy);

    // unpack tileX & tileY
    float compressed = a_packed_data.w;
    vec2 pos_in_tile;
    pos_in_tile.x = floor(compressed * SHIFT_RIGHT19);
    compressed -= pos_in_tile.x * SHIFT_LEFT19;
    pos_in_tile.x = pos_in_tile.x - 512.;
    pos_in_tile.y = floor(compressed * SHIFT_RIGHT6);
    compressed -= pos_in_tile.y * SHIFT_LEFT6;
    pos_in_tile.y = pos_in_tile.y - 512.;

    // unpack data(extrude(4-bit), radius(16-bit))
    compressed = a_packed_data.z;

    // extrude(4-bit)
    vec2 extrude;
    extrude.x = floor(compressed * SHIFT_RIGHT23);
    compressed -= extrude.x * SHIFT_LEFT23;
    extrude.x = extrude.x - 1.;

    extrude.y = floor(compressed * SHIFT_RIGHT21);
    compressed -= extrude.y * SHIFT_LEFT21;
    extrude.y = extrude.y - 1.;

    float shape_type = floor(compressed * SHIFT_RIGHT17);
    compressed -= shape_type * SHIFT_LEFT17;

    // radius(16-bit)
    float radius = compressed;

    float stroke_width = a_packed_data2.z;
    float stroke_opacity = a_packed_data2.w;
    float opacity = a_packed_data3.x;

    gl_Position = u_matrix * vec4(pos_in_tile, 0.0, 1.0);
    gl_Position.xy += extrude * (radius + stroke_width) * u_extrude_scale * gl_Position.w;

    float antialiasblur = 1.0 / DEVICE_PIXEL_RATIO / (radius + stroke_width);

    v_data = vec4(extrude, antialiasblur, shape_type);
    v_data2 = vec4(radius, opacity, stroke_width, stroke_opacity);
}