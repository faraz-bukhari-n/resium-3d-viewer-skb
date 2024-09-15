import {
  Cartesian3,
  Cartographic,
  Ellipsoid,
  HeadingPitchRoll,
  Ion,
  Matrix3,
  Matrix4,
  Quaternion,
  Transforms
} from 'cesium';
import React, { useRef } from 'react';
import { Cesium3DTileset, Viewer } from 'resium';

Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxM2E2ZDMzOS00ZWYzLTQ3ZDAtYThlYy1iNDY0Zjc3MmJhNjEiLCJpZCI6MTAxMTIsImlhdCI6MTcyMDg5Njk4M30.5z30-uwLxqQzNTspJdSQeZsitYg1oeJ-v4zunZXAUwg';

// Map model configuration
const mapModel = {
  map: {
    url: '/tiles/tileset.json',
    x: 9.2343,
    y: 49.2005,
    heightoffset: -260,
    heading: 0,
    pitch: 0,
    roll: 0
  }
};

// Transformation functions
const setWorldPositionFromCartographic = (transform, positionCartographic) => {
  const oldPositionCartesian = Matrix4.multiplyByPoint(
    transform,
    Cartesian3.ZERO,
    new Cartesian3()
  );
  const newPositionCartesian = Ellipsoid.WGS84.cartographicToCartesian(
    positionCartographic,
    new Cartesian3()
  );
  const translation = Cartesian3.subtract(
    newPositionCartesian,
    oldPositionCartesian,
    new Cartesian3()
  );
  const translationMatrix = Matrix4.fromTranslation(translation, new Matrix4());
  return Matrix4.multiply(translationMatrix, transform, transform);
};

const setRotationFromHeadingPitchRoll = (transform, headingPitchRoll) => {
  const rotationQuaternion = Quaternion.fromHeadingPitchRoll(
    headingPitchRoll,
    new Quaternion()
  );
  const translation = Matrix4.getTranslation(transform, new Cartesian3());
  const scale = Matrix4.getScale(transform, new Cartesian3());
  const center = Matrix4.multiplyByPoint(
    transform,
    Cartesian3.ZERO,
    new Cartesian3()
  );
  const backTransform = Transforms.eastNorthUpToFixedFrame(
    center,
    undefined,
    new Matrix4()
  );
  const rotationFixed = Matrix4.getRotation(backTransform, new Matrix3());
  const quaternionFixed = Quaternion.fromRotationMatrix(
    rotationFixed,
    new Quaternion()
  );
  const rotation = Quaternion.multiply(
    quaternionFixed,
    rotationQuaternion,
    new Quaternion()
  );
  return Matrix4.fromTranslationQuaternionRotationScale(
    translation,
    rotation,
    scale,
    transform
  );
};

function App() {
  const viewerRef = useRef(null);

  const handleReady = (tileset) => {
    try {
      // Make the camera fly to the tileset when it is ready
      const viewer = viewerRef?.current.cesiumElement;
      // Set position offset
      const offset = Cartographic.fromDegrees(
        mapModel.map.x,
        mapModel.map.y,
        mapModel.map.heightoffset
      );
      tileset._root.transform = setWorldPositionFromCartographic(
        tileset._root.transform,
        offset
      );

      // Set rotation
      const hpr = HeadingPitchRoll.fromDegrees(
        mapModel.map.heading,
        mapModel.map.pitch,
        mapModel.map.roll
      );
      tileset._root.transform = setRotationFromHeadingPitchRoll(
        tileset._root.transform,
        hpr
      );

      viewer?.camera.flyToBoundingSphere(tileset.boundingSphere, {
        duration: 2.0 // Adjust the duration for zoom effect
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Viewer
      full
      ref={viewerRef}
      scene3DOnly
      animation={false}
      timeline={false}
      geocoder={true}
      fullscreenButton={false}
      homeButton={false}
      navigationHelpButton={false}
      skyAtmosphere={false}
      infoBox={false}
      selectionIndicator={false}
      skyBox={false}
      baseLayerPicker={false}
    >
      <Cesium3DTileset
        url={mapModel.map.url}
        maximumScreenSpaceError={50}
        maximumNumberOfLoadedTiles={1000}
        onReady={handleReady}
      />
    </Viewer>
  );
}

export default App;
