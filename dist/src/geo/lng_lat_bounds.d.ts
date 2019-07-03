import LngLat, { LngLatLike } from './lng_lat';
/**
 * A `LngLatBounds` object represents a geographical bounding box,
 * defined by its southwest and northeast points in longitude and latitude.
 *
 * If no arguments are provided to the constructor, a `null` bounding box is created.
 *
 * Note that any Mapbox GL method that accepts a `LngLatBounds` object as an argument or option
 * can also accept an `Array` of two {@link LngLatLike} constructs and will perform an implicit conversion.
 * This flexible type is documented as {@link LngLatBoundsLike}.
 *
 * @param {LngLatLike} [sw] The southwest corner of the bounding box.
 * @param {LngLatLike} [ne] The northeast corner of the bounding box.
 * @example
 * var sw = new mapboxgl.LngLat(-73.9876, 40.7661);
 * var ne = new mapboxgl.LngLat(-73.9397, 40.8002);
 * var llb = new mapboxgl.LngLatBounds(sw, ne);
 */
declare class LngLatBounds {
    _ne: LngLat;
    _sw: LngLat;
    constructor(sw: any, ne: any);
    /**
     * Set the northeast corner of the bounding box
     *
     * @param {LngLatLike} ne
     * @returns {LngLatBounds} `this`
     */
    setNorthEast(ne: LngLatLike): this;
    /**
     * Set the southwest corner of the bounding box
     *
     * @param {LngLatLike} sw
     * @returns {LngLatBounds} `this`
     */
    setSouthWest(sw: LngLatLike): this;
    /**
     * Extend the bounds to include a given LngLat or LngLatBounds.
     *
     * @param {LngLat|LngLatBounds} obj object to extend to
     * @returns {LngLatBounds} `this`
     */
    extend(obj: LngLat | LngLatBounds): LngLatBounds;
    /**
     * Returns the geographical coordinate equidistant from the bounding box's corners.
     *
     * @returns {LngLat} The bounding box's center.
     * @example
     * var llb = new mapboxgl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.getCenter(); // = LngLat {lng: -73.96365, lat: 40.78315}
     */
    getCenter(): LngLat;
    /**
     * Returns the southwest corner of the bounding box.
     *
     * @returns {LngLat} The southwest corner of the bounding box.
     */
    getSouthWest(): LngLat;
    /**
    * Returns the northeast corner of the bounding box.
    *
    * @returns {LngLat} The northeast corner of the bounding box.
     */
    getNorthEast(): LngLat;
    /**
    * Returns the northwest corner of the bounding box.
    *
    * @returns {LngLat} The northwest corner of the bounding box.
     */
    getNorthWest(): LngLat;
    /**
    * Returns the southeast corner of the bounding box.
    *
    * @returns {LngLat} The southeast corner of the bounding box.
     */
    getSouthEast(): LngLat;
    /**
    * Returns the west edge of the bounding box.
    *
    * @returns {number} The west edge of the bounding box.
     */
    getWest(): number;
    /**
    * Returns the south edge of the bounding box.
    *
    * @returns {number} The south edge of the bounding box.
     */
    getSouth(): number;
    /**
    * Returns the east edge of the bounding box.
    *
    * @returns {number} The east edge of the bounding box.
     */
    getEast(): number;
    /**
    * Returns the north edge of the bounding box.
    *
    * @returns {number} The north edge of the bounding box.
     */
    getNorth(): number;
    /**
     * Returns the bounding box represented as an array.
     *
     * @returns {Array<Array<number>>} The bounding box represented as an array, consisting of the
     *   southwest and northeast coordinates of the bounding represented as arrays of numbers.
     * @example
     * var llb = new mapboxgl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.toArray(); // = [[-73.9876, 40.7661], [-73.9397, 40.8002]]
     */
    toArray(): number[][];
    /**
     * Return the bounding box represented as a string.
     *
     * @returns {string} The bounding box represents as a string of the format
     *   `'LngLatBounds(LngLat(lng, lat), LngLat(lng, lat))'`.
     * @example
     * var llb = new mapboxgl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
     * llb.toString(); // = "LngLatBounds(LngLat(-73.9876, 40.7661), LngLat(-73.9397, 40.8002))"
     */
    toString(): string;
    /**
     * Check if the bounding box is an empty/`null`-type box.
     *
     * @returns {boolean} True if bounds have been defined, otherwise false.
     */
    isEmpty(): boolean;
    /**
     * Converts an array to a `LngLatBounds` object.
     *
     * If a `LngLatBounds` object is passed in, the function returns it unchanged.
     *
     * Internally, the function calls `LngLat#convert` to convert arrays to `LngLat` values.
     *
     * @param {LngLatBoundsLike} input An array of two coordinates to convert, or a `LngLatBounds` object to return.
     * @returns {LngLatBounds} A new `LngLatBounds` object, if a conversion occurred, or the original `LngLatBounds` object.
     * @example
     * var arr = [[-73.9876, 40.7661], [-73.9397, 40.8002]];
     * var llb = mapboxgl.LngLatBounds.convert(arr);
     * llb;   // = LngLatBounds {_sw: LngLat {lng: -73.9876, lat: 40.7661}, _ne: LngLat {lng: -73.9397, lat: 40.8002}}
     */
    static convert(input: LngLatBoundsLike): LngLatBounds;
}
/**
 * A {@link LngLatBounds} object, an array of {@link LngLatLike} objects in [sw, ne] order,
 * or an array of numbers in [west, south, east, north] order.
 *
 * @typedef {LngLatBounds | [LngLatLike, LngLatLike] | [number, number, number, number]} LngLatBoundsLike
 * @example
 * var v1 = new mapboxgl.LngLatBounds(
 *   new mapboxgl.LngLat(-73.9876, 40.7661),
 *   new mapboxgl.LngLat(-73.9397, 40.8002)
 * );
 * var v2 = new mapboxgl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002])
 * var v3 = [[-73.9876, 40.7661], [-73.9397, 40.8002]];
 */
export declare type LngLatBoundsLike = LngLatBounds | [LngLatLike, LngLatLike] | [number, number, number, number];
export default LngLatBounds;
