attribute vec3 a_pos;
attribute vec3 a_next;
attribute vec3 a_prev;
attribute float a_orientation;
attribute float a_counters;

attribute vec4 a_color;

uniform mat4 u_matrix;
uniform float u_thickness;
varying vec4 v_color;
varying vec2 v_normal;
varying float v_counters;

#pragma include "common"
#pragma include "project"

vec2 project_to_screenspace(vec4 position, float aspect) {
	return position.xy / position.w * aspect;
}

void main() {
    v_color = a_color;
    v_counters = a_counters;

    // 宽高比
    float aspect = u_viewport_size.x / u_viewport_size.y;

    // 先投影到裁剪空间
    vec4 projected_current = project_to_clipping_space(a_pos);
    vec2 currentP = project_to_screenspace(projected_current, aspect);
    // v_pos = currentP;
    vec2 prevP = project_to_screenspace(project_to_clipping_space(a_prev), aspect);
    vec2 nextP = project_to_screenspace(project_to_clipping_space(a_next), aspect);

    vec2 dir = vec2(0.0);
    vec2 n = vec2(0.0);
    float len = u_thickness;
    if (currentP == prevP) {
        dir = normalize(nextP - currentP);
        n = vec2(-dir.y, dir.x);
        // currentP = nextP;
    } else if (currentP == nextP) {
        dir = normalize(currentP - prevP);
        n = vec2(-dir.y, dir.x);
    } else {
        // 计算切线和 miter
        vec2 dir1 = normalize(currentP - prevP);
        vec2 dir2 = normalize(nextP - currentP);
        vec2 tangent = normalize(dir1 + dir2);
        vec2 perp = vec2(-dir1.y, dir1.x);
        vec2 miter = vec2(-tangent.y, tangent.x);

        // 投影到 miter 方向
        len = u_thickness / dot(miter, perp);
        dir = tangent;

        n = vec2(-dir1.y, dir1.x);
    }

    vec2 normal = vec2(-dir.y, dir.x);
    v_normal = n * a_orientation;

    normal *= len / 2.0 / 100.;
    normal.x /= aspect;

    // 得到最终偏移量
    vec4 offset = vec4(normal * a_orientation, 0.0, 0.0);
    gl_Position = projected_current + offset;
}
