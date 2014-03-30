/*global
SculptGL:false
*/
'use strict';

var Subdivision = {};

/** Apply a complete loop subdivision */
Subdivision.applyLoopSubdivision = function (baseMesh, newMesh) {
  //       v3
  //       /\
  //      /3T\ 
  //   m3/____\m2
  //    /\ 0T /\
  //   /1T\  /2T\
  //  /____\/____\ 
  // v1    m1    v2

  Subdivision.allocateArrays(baseMesh, newMesh);
  Subdivision.applyEvenSmooth(baseMesh, newMesh.verticesXYZ_);
  Subdivision.subdivision(baseMesh, newMesh);
};

/** Apply a complete loop subdivision */
Subdivision.allocateArrays = function (baseMesh, newMesh) {
  var oldNbEdges = baseMesh.getNbEdges();
  var oldNbVertices = baseMesh.getNbVertices();
  var oldNbTriangles = baseMesh.getNbTriangles();

  // init main arrays
  newMesh.verticesXYZ_ = new Float32Array((oldNbVertices + oldNbEdges) * 3);
  newMesh.indicesABC_ = new SculptGL.indexArrayType(oldNbTriangles * 4 * 3);
  newMesh.edges_ = new Uint8Array(oldNbEdges * 2 + oldNbTriangles * 3);
  // init everything else
  newMesh.allocateArrays();
  // keep colors
  newMesh.colorsRGB_.set(baseMesh.colorsRGB_);
  // keep the vertex on edge
  newMesh.vertOnEdge_.set(baseMesh.vertOnEdge_);
};

/** Compute the position of odd verties + creates triangles (+ topology) */
Subdivision.subdivision = function (baseMesh, newMesh) {
  var i = 0;
  var vArOld = baseMesh.verticesXYZ_;
  var iArOld = baseMesh.indicesABC_;
  var teArOld = baseMesh.triEdges_;
  var eArOld = baseMesh.edges_;

  var iAr = newMesh.indicesABC_;
  var cAr = newMesh.colorsRGB_;
  var vAr = newMesh.verticesXYZ_;
  var teAr = newMesh.triEdges_;
  var vertOnEdge = newMesh.vertOnEdge_;
  var eAr = newMesh.edges_;
  var vertRingVert = newMesh.vertRingVert_;
  var vertRingTri = newMesh.vertRingTri_;

  var nbEdges = newMesh.getNbEdges();
  var tagEdges = new Int32Array(nbEdges);
  for (i = 0; i < nbEdges; ++i)
    tagEdges[i] = -1;

  var nbVertices = baseMesh.getNbVertices();

  var tag1 = 0,
    tag2 = 0,
    tag3 = 0;
  var ivMid1 = 0,
    ivMid2 = 0,
    ivMid3 = 0;
  var id1 = 0,
    id2 = 0,
    id3 = 0;
  var idMid = 0,
    idOpp = 0;

  var nbTris = baseMesh.getNbTriangles();
  var nbEdgesOffset = baseMesh.indicesABC_.length;
  for (i = 0; i < nbTris; ++i) {
    var id = i * 3;
    var iv1 = iArOld[id];
    var iv2 = iArOld[id + 1];
    var iv3 = iArOld[id + 2];

    var ide1 = teArOld[id];
    var ide2 = teArOld[id + 1];
    var ide3 = teArOld[id + 2];

    //  edge V1-v2
    if (eArOld[ide1] === 1) {
      tag1 = -1;
      ivMid1 = nbVertices++;
      vertOnEdge[ivMid1] = 1;
      idMid = ivMid1 * 3;
      id1 = iv1 * 3;
      id2 = iv2 * 3;

      vAr[idMid] = 0.5 * (vArOld[id1] + vArOld[id2]);
      vAr[idMid + 1] = 0.5 * (vArOld[id1 + 1] + vArOld[id2 + 1]);
      vAr[idMid + 2] = 0.5 * (vArOld[id1 + 2] + vArOld[id2 + 2]);

      cAr[idMid] = 0.5 * (cAr[id1] + cAr[id2]);
      cAr[idMid + 1] = 0.5 * (cAr[id1 + 1] + cAr[id2 + 1]);
      cAr[idMid + 2] = 0.5 * (cAr[id1 + 2] + cAr[id2 + 2]);
    } else {
      tag1 = tagEdges[ide1];
      idOpp = iv3 * 3;
      if (tag1 === -1) {
        ivMid1 = nbVertices++;
        tagEdges[ide1] = ivMid1;
        idMid = ivMid1 * 3;
        id1 = iv1 * 3;
        id2 = iv2 * 3;
        vAr[idMid] = 0.125 * vArOld[idOpp] + 0.375 * (vArOld[id1] + vArOld[id2]);
        vAr[idMid + 1] = 0.125 * vArOld[idOpp + 1] + 0.375 * (vArOld[id1 + 1] + vArOld[id2 + 1]);
        vAr[idMid + 2] = 0.125 * vArOld[idOpp + 2] + 0.375 * (vArOld[id1 + 2] + vArOld[id2 + 2]);

        cAr[idMid] = 0.125 * cAr[idOpp] + 0.375 * (cAr[id1] + cAr[id2]);
        cAr[idMid + 1] = 0.125 * cAr[idOpp + 1] + 0.375 * (cAr[id1 + 1] + cAr[id2 + 1]);
        cAr[idMid + 2] = 0.125 * cAr[idOpp + 2] + 0.375 * (cAr[id1 + 2] + cAr[id2 + 2]);
      } else {
        ivMid1 = tag1;
        idMid = ivMid1 * 3;
        vAr[idMid] += 0.125 * vArOld[idOpp];
        vAr[idMid + 1] += 0.125 * vArOld[idOpp + 1];
        vAr[idMid + 2] += 0.125 * vArOld[idOpp + 2];

        cAr[idMid] += 0.125 * cAr[idOpp];
        cAr[idMid + 1] += 0.125 * cAr[idOpp + 1];
        cAr[idMid + 2] += 0.125 * cAr[idOpp + 2];
      }
    }

    //  edge V2-v3
    if (eArOld[ide2] === 1) {
      tag2 = -1;
      ivMid2 = nbVertices++;
      vertOnEdge[ivMid2] = 1;
      idMid = ivMid2 * 3;
      id2 = iv2 * 3;
      id3 = iv3 * 3;

      vAr[idMid] = 0.5 * (vArOld[id2] + vArOld[id3]);
      vAr[idMid + 1] = 0.5 * (vArOld[id2 + 1] + vArOld[id3 + 1]);
      vAr[idMid + 2] = 0.5 * (vArOld[id2 + 2] + vArOld[id3 + 2]);

      cAr[idMid] = 0.5 * (cAr[id2] + cAr[id3]);
      cAr[idMid + 1] = 0.5 * (cAr[id2 + 1] + cAr[id3 + 1]);
      cAr[idMid + 2] = 0.5 * (cAr[id2 + 2] + cAr[id3 + 2]);
    } else {
      tag2 = tagEdges[ide2];
      idOpp = iv1 * 3;
      if (tag2 === -1) {
        ivMid2 = nbVertices++;
        tagEdges[ide2] = ivMid2;
        idMid = ivMid2 * 3;
        id2 = iv2 * 3;
        id3 = iv3 * 3;
        vAr[idMid] = 0.125 * vArOld[idOpp] + 0.375 * (vArOld[id2] + vArOld[id3]);
        vAr[idMid + 1] = 0.125 * vArOld[idOpp + 1] + 0.375 * (vArOld[id2 + 1] + vArOld[id3 + 1]);
        vAr[idMid + 2] = 0.125 * vArOld[idOpp + 2] + 0.375 * (vArOld[id2 + 2] + vArOld[id3 + 2]);

        cAr[idMid] = 0.125 * cAr[idOpp] + 0.375 * (cAr[id2] + cAr[id3]);
        cAr[idMid + 1] = 0.125 * cAr[idOpp + 1] + 0.375 * (cAr[id2 + 1] + cAr[id3 + 1]);
        cAr[idMid + 2] = 0.125 * cAr[idOpp + 2] + 0.375 * (cAr[id2 + 2] + cAr[id3 + 2]);
      } else {
        ivMid2 = tag2;
        idMid = ivMid2 * 3;
        vAr[idMid] += 0.125 * vArOld[idOpp];
        vAr[idMid + 1] += 0.125 * vArOld[idOpp + 1];
        vAr[idMid + 2] += 0.125 * vArOld[idOpp + 2];

        cAr[idMid] += 0.125 * cAr[idOpp];
        cAr[idMid + 1] += 0.125 * cAr[idOpp + 1];
        cAr[idMid + 2] += 0.125 * cAr[idOpp + 2];
      }
    }

    //  edge V1-v3
    if (eArOld[ide3] === 1) {
      tag3 = -1;
      ivMid3 = nbVertices++;
      vertOnEdge[ivMid3] = 1;
      idMid = ivMid3 * 3;
      id1 = iv1 * 3;
      id3 = iv3 * 3;

      vAr[idMid] = 0.5 * (vArOld[id1] + vArOld[id3]);
      vAr[idMid + 1] = 0.5 * (vArOld[id1 + 1] + vArOld[id3 + 1]);
      vAr[idMid + 2] = 0.5 * (vArOld[id1 + 2] + vArOld[id3 + 2]);

      cAr[idMid] = 0.5 * (cAr[id1] + cAr[id3]);
      cAr[idMid + 1] = 0.5 * (cAr[id1 + 1] + cAr[id3 + 1]);
      cAr[idMid + 2] = 0.5 * (cAr[id1 + 2] + cAr[id3 + 2]);
    } else {
      tag3 = tagEdges[ide3];
      idOpp = iv2 * 3;
      if (tag3 === -1) {
        ivMid3 = nbVertices++;
        tagEdges[ide3] = ivMid3;
        idMid = ivMid3 * 3;
        id1 = iv1 * 3;
        id3 = iv3 * 3;
        vAr[idMid] = 0.125 * vArOld[idOpp] + 0.375 * (vArOld[id1] + vArOld[id3]);
        vAr[idMid + 1] = 0.125 * vArOld[idOpp + 1] + 0.375 * (vArOld[id1 + 1] + vArOld[id3 + 1]);
        vAr[idMid + 2] = 0.125 * vArOld[idOpp + 2] + 0.375 * (vArOld[id1 + 2] + vArOld[id3 + 2]);

        cAr[idMid] = 0.125 * cAr[idOpp] + 0.375 * (cAr[id1] + cAr[id3]);
        cAr[idMid + 1] = 0.125 * cAr[idOpp + 1] + 0.375 * (cAr[id1 + 1] + cAr[id3 + 1]);
        cAr[idMid + 2] = 0.125 * cAr[idOpp + 2] + 0.375 * (cAr[id1 + 2] + cAr[id3 + 2]);
      } else {
        ivMid3 = tag3;
        idMid = ivMid3 * 3;
        vAr[idMid] += 0.125 * vArOld[idOpp];
        vAr[idMid + 1] += 0.125 * vArOld[idOpp + 1];
        vAr[idMid + 2] += 0.125 * vArOld[idOpp + 2];

        cAr[idMid] += 0.125 * cAr[idOpp];
        cAr[idMid + 1] += 0.125 * cAr[idOpp + 1];
        cAr[idMid + 2] += 0.125 * cAr[idOpp + 2];
      }
    }

    var e1center = id;
    var e2center = id + 1;
    var e3center = id + 2;

    iAr[id] = ivMid1;
    iAr[id + 1] = ivMid2;
    iAr[id + 2] = ivMid3;
    teAr[id] = e1center;
    teAr[id + 1] = e2center;
    teAr[id + 2] = e3center;

    id += nbTris;
    var tri1 = id;
    var tri2 = id + 1;
    var tri3 = id + 2;

    id = tri1 * 3;
    iAr[id] = iv1;
    iAr[id + 1] = ivMid1;
    iAr[id + 2] = ivMid3;
    teAr[id] = iv1 < iv2 ? nbEdgesOffset + ide1 : nbEdges - ide1 - 1;
    teAr[id + 1] = e3center;
    teAr[id + 2] = iv3 > iv1 ? nbEdgesOffset + ide3 : nbEdges - ide3 - 1;

    id = tri2 * 3;
    iAr[id] = ivMid1;
    iAr[id + 1] = iv2;
    iAr[id + 2] = ivMid2;
    teAr[id] = iv1 > iv2 ? nbEdgesOffset + ide1 : nbEdges - ide1 - 1;
    teAr[id + 1] = iv2 < iv3 ? nbEdgesOffset + ide2 : nbEdges - ide2 - 1;
    teAr[id + 2] = e1center;

    id = tri3 * 3;
    iAr[id] = ivMid2;
    iAr[id + 1] = iv3;
    iAr[id + 2] = ivMid3;
    teAr[id] = iv2 > iv3 ? nbEdgesOffset + ide2 : nbEdges - ide2 - 1;
    teAr[id + 1] = iv3 < iv1 ? nbEdgesOffset + ide3 : nbEdges - ide3 - 1;
    teAr[id + 2] = e2center;

    // Update vertex topology

    vertRingTri[ivMid1].push(i, tri1, tri2);
    vertRingTri[ivMid2].push(i, tri2, tri3);
    vertRingTri[ivMid3].push(i, tri1, tri3);

    vertRingTri[iv1].push(tri1);
    vertRingTri[iv2].push(tri2);
    vertRingTri[iv3].push(tri3);

    if (tag1 === -1) {
      vertRingVert[ivMid1].push(iv1, iv2, ivMid2, ivMid3);
      vertRingVert[iv1].push(ivMid1);
      vertRingVert[iv2].push(ivMid1);
    } else {
      vertRingVert[ivMid1].push(ivMid2, ivMid3);
    }

    if (tag2 === -1) {
      vertRingVert[ivMid2].push(iv2, iv3, ivMid1, ivMid3);
      vertRingVert[iv2].push(ivMid2);
      vertRingVert[iv3].push(ivMid2);
    } else {
      vertRingVert[ivMid2].push(ivMid1, ivMid3);
    }

    if (tag3 === -1) {
      vertRingVert[ivMid3].push(iv1, iv3, ivMid1, ivMid2);
      vertRingVert[iv1].push(ivMid3);
      vertRingVert[iv3].push(ivMid3);
    } else {
      vertRingVert[ivMid3].push(ivMid1, ivMid2);
    }
  }
  var nbTriEdges = teAr.length;
  for (i = 0; i < nbTriEdges; ++i)
    eAr[teAr[i]]++;
};

/** Apply loop subdivision without topology update */
Subdivision.geometrySubdivide = function (baseMesh, vertOut) {
  Subdivision.applyEvenSmooth(baseMesh, vertOut);
  Subdivision.applyOddSmooth(baseMesh, vertOut);
};

/** Even vertices smoothing */
Subdivision.applyEvenSmooth = function (baseMesh, even) {
  var vArOld = baseMesh.verticesXYZ_;
  var vertOnEdgeOld = baseMesh.vertOnEdge_;
  var vertRingVert = baseMesh.vertRingVert_;
  var nbVerts = baseMesh.getNbVertices();

  for (var i = 0; i < nbVerts; ++i) {
    var j = i * 3;
    var ring = vertRingVert[i];
    var nbVRing = ring.length;
    var avx = 0.0,
      avy = 0.0,
      avz = 0.0;
    var beta = 0.0,
      betaComp = 0.0;
    var k = 0;
    if (vertOnEdgeOld[i]) { //edge vertex
      var comp = 0;
      for (k = 0; k < nbVRing; ++k) {
        var ind = ring[k];
        if (vertOnEdgeOld[ind]) {
          ind *= 3;
          avx += vArOld[ind];
          avy += vArOld[ind + 1];
          avz += vArOld[ind + 2];
          comp++;
        }
      }
      comp = 0.25 / comp;
      even[j] = vArOld[j] * 0.75 + avx * comp;
      even[j + 1] = vArOld[j + 1] * 0.75 + avy * comp;
      even[j + 2] = vArOld[j + 2] * 0.75 + avz * comp;
    } else {
      for (k = 0; k < nbVRing; ++k) {
        var id = ring[k] * 3;
        avx += vArOld[id];
        avy += vArOld[id + 1];
        avz += vArOld[id + 2];
      }
      if (nbVRing === 6) {
        beta = 0.0625;
        betaComp = 0.625;
      } else if (nbVRing === 3) { //warren weights
        beta = 0.1875;
        betaComp = 0.4375;
      } else {
        beta = 0.375 / nbVRing;
        betaComp = 0.625;
      }
      even[j] = vArOld[j] * betaComp + avx * beta;
      even[j + 1] = vArOld[j + 1] * betaComp + avy * beta;
      even[j + 2] = vArOld[j + 2] * betaComp + avz * beta;
    }
  }
};

/** Odd vertices smoothing */
Subdivision.applyOddSmooth = function (mesh, odds) {
  var i = 0;
  var iAr = mesh.indicesABC_;
  var vAr = mesh.verticesXYZ_;
  var teAr = mesh.triEdges_;
  var eAr = mesh.edges_;
  var nbVertices = mesh.getNbVertices();
  var nbTris = mesh.getNbTriangles();

  var nbEdges = mesh.getNbEdges();
  var tagEdges = new Int32Array(nbEdges);
  for (i = 0; i < nbEdges; ++i)
    tagEdges[i] = -1;

  var id1 = 0,
    id2 = 0,
    id3 = 0;
  var ivMid1 = 0,
    ivMid2 = 0,
    ivMid3 = 0;
  var idMid = 0,
    idOpp = 0;
  for (i = 0; i < nbTris; ++i) {
    var id = i * 3;
    var iv1 = iAr[id];
    var iv2 = iAr[id + 1];
    var iv3 = iAr[id + 2];

    var ide1 = teAr[id];
    var ide2 = teAr[id + 1];
    var ide3 = teAr[id + 2];

    //  edge V1-v2
    if (eAr[ide1] === 1) {
      ivMid1 = nbVertices++;
      idMid = ivMid1 * 3;
      id1 = iv1 * 3;
      id2 = iv2 * 3;
      odds[idMid] = 0.5 * (vAr[id1] + vAr[id2]);
      odds[idMid + 1] = 0.5 * (vAr[id1 + 1] + vAr[id2 + 1]);
      odds[idMid + 2] = 0.5 * (vAr[id1 + 2] + vAr[id2 + 2]);
    } else {
      ivMid1 = tagEdges[ide1];
      idOpp = iv3 * 3;
      if (ivMid1 === -1) {
        ivMid1 = nbVertices++;
        tagEdges[ide1] = ivMid1;
        idMid = ivMid1 * 3;
        id1 = iv1 * 3;
        id2 = iv2 * 3;
        odds[idMid] = 0.125 * vAr[idOpp] + 0.375 * (vAr[id1] + vAr[id2]);
        odds[idMid + 1] = 0.125 * vAr[idOpp + 1] + 0.375 * (vAr[id1 + 1] + vAr[id2 + 1]);
        odds[idMid + 2] = 0.125 * vAr[idOpp + 2] + 0.375 * (vAr[id1 + 2] + vAr[id2 + 2]);
      } else {
        idMid = ivMid1 * 3;
        odds[idMid] += 0.125 * vAr[idOpp];
        odds[idMid + 1] += 0.125 * vAr[idOpp + 1];
        odds[idMid + 2] += 0.125 * vAr[idOpp + 2];
      }
    }

    //  edge V2-v3
    if (eAr[ide2] === 1) {
      ivMid2 = nbVertices++;
      idMid = ivMid2 * 3;
      id2 = iv2 * 3;
      id3 = iv3 * 3;
      odds[idMid] = 0.5 * (vAr[id2] + vAr[id3]);
      odds[idMid + 1] = 0.5 * (vAr[id2 + 1] + vAr[id3 + 1]);
      odds[idMid + 2] = 0.5 * (vAr[id2 + 2] + vAr[id3 + 2]);
    } else {
      ivMid2 = tagEdges[ide2];
      idOpp = iv1 * 3;
      if (ivMid2 === -1) {
        ivMid2 = nbVertices++;
        tagEdges[ide2] = ivMid2;
        idMid = ivMid2 * 3;
        id2 = iv2 * 3;
        id3 = iv3 * 3;
        odds[idMid] = 0.125 * vAr[idOpp] + 0.375 * (vAr[id2] + vAr[id3]);
        odds[idMid + 1] = 0.125 * vAr[idOpp + 1] + 0.375 * (vAr[id2 + 1] + vAr[id3 + 1]);
        odds[idMid + 2] = 0.125 * vAr[idOpp + 2] + 0.375 * (vAr[id2 + 2] + vAr[id3 + 2]);
      } else {
        idMid = ivMid2 * 3;
        odds[idMid] += 0.125 * vAr[idOpp];
        odds[idMid + 1] += 0.125 * vAr[idOpp + 1];
        odds[idMid + 2] += 0.125 * vAr[idOpp + 2];
      }
    }

    //  edge V1-v3
    if (eAr[ide3] === 1) {
      ivMid3 = nbVertices++;
      idMid = ivMid3 * 3;
      id1 = iv1 * 3;
      id3 = iv3 * 3;
      odds[idMid] = 0.5 * (vAr[id1] + vAr[id3]);
      odds[idMid + 1] = 0.5 * (vAr[id1 + 1] + vAr[id3 + 1]);
      odds[idMid + 2] = 0.5 * (vAr[id1 + 2] + vAr[id3 + 2]);
    } else {
      ivMid3 = tagEdges[ide3];
      idOpp = iv2 * 3;
      if (ivMid3 === -1) {
        ivMid3 = nbVertices++;
        tagEdges[ide3] = ivMid3;
        idMid = ivMid3 * 3;
        id1 = iv1 * 3;
        id3 = iv3 * 3;
        odds[idMid] = 0.125 * vAr[idOpp] + 0.375 * (vAr[id1] + vAr[id3]);
        odds[idMid + 1] = 0.125 * vAr[idOpp + 1] + 0.375 * (vAr[id1 + 1] + vAr[id3 + 1]);
        odds[idMid + 2] = 0.125 * vAr[idOpp + 2] + 0.375 * (vAr[id1 + 2] + vAr[id3 + 2]);
      } else {
        idMid = ivMid3 * 3;
        odds[idMid] += 0.125 * vAr[idOpp];
        odds[idMid + 1] += 0.125 * vAr[idOpp + 1];
        odds[idMid + 2] += 0.125 * vAr[idOpp + 2];
      }
    }
  }
};