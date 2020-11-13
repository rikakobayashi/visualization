//Constants for the SVG
import * as d3 from "d3";
import { sankey } from "d3-sankey";
import data from "../dist/data.json";

const Data: JSONDataType = data;

interface JSONDataType {
  order_all: OrderDataType[][];
  Risk1: RiskType[];
  Risk2: RiskType[];
  Cost1: RiskType[];
  Cost2: RiskType[];
  // order1: OrderType[][];
  // order2: OrderType[][];
  Pnum: RiskType[];
  Statistics: StatisticsType;
  groups: { [key: string]: GroupOrderDataType[] };
}

interface OrderDataType {
  id: number;
  order_type: string;
  order_explain: string;
  order_name: string;
  code: string;
  day: string;
  next_item_id: Array<number>;
  isGroup?: boolean;
}

interface GroupOrderDataType {
  order_type: string;
  order_explain: string;
  order_name: string;
  code: string;
  day: string;
}

interface OrderType extends OrderDataType {
  r_x: number;
  r_y: number;
}

interface RiskType {
  seq: number;
  value: number;
}

type StatisticsType = {
  value: {
    IRP: number;
    SRP: number;
    LOSP: number;
    COSTP: number;
  };
  result: {
    IRSD: string;
    SRSD: string;
    LOSSD: string;
    COSTSD: string;
  };
};

interface PlaceType {
  r_x: number;
  r_y: number;
}

interface LineType {
  source: number;
  target: number;
}

interface LinksType {
  source: number;
  target: number;
  value: number;
  precision?: string;
  factor?: string;
}

d3.json("data.json", function (error, data: JSONDataType) {
  const N1 = 8;
  const circle_r = 20;
  const link_length = 203; //文字が重なる場合はここの値を変更
  const margin = 110; // 全体が入るようにノードを右にずらす
  const width = N1 * (link_length + circle_r);
  const height = 500;
  const rect_x = 0;
  const rect_y = 0;
  const info_x = 0;
  const count = 0;
  const graph: { orders: OrderType[]; links: LinksType[] } = {
    orders: [],
    links: [],
  };
  // const graph2: { nodes: OrderType[]; links: LinksType[] } = {
  //   nodes: [],
  //   links: [],
  // };
  // const graph3: { nodes: OrderType[]; links: LinksType[] } = {
  //   nodes: [],
  //   links: [],
  // };
  // const graph4: { nodes: OrderType[]; links: LinksType[] } = {
  //   nodes: [],
  //   links: [],
  // };
  // const graph5: { nodes: OrderType[]; links: LinksType[] } = {
  //   nodes: [],
  //   links: [],
  // };
  const place: PlaceType[] = []; //nodeの中心位置を記録する{r_x,r_y}
  const a_line: LineType[] = [];
  // const place2: PlaceType[] = []; //nodeの中心位置を記録する{r_x,r_y}
  // const a_line2: LineType[] = [];
  // const place3: PlaceType[] = []; //nodeの中心位置を記録する{r_x,r_y}
  // const a_line3: LineType[] = [];

  const IR = data.Risk1;
  const SR = data.Risk2;
  const LOS = data.Cost1;
  const Cost = data.Cost2;
  const Statistics = data.Statistics;

  let max_order_length = 0;
  let height_s = 0;

  data.order_all.forEach((orders_by_seq, seq_index) => {
    orders_by_seq.forEach((order, order_index) => {
      // ordersを定義
      if (order.isGroup) {
        // groupがある時
        console.log(order.order_type);
        console.log(data.groups[order.order_type]);
        data.groups[order.order_type].forEach((_order, index) => {
          // graph.ordersを定義
          graph.orders.push({
            ..._order,
            id: order.id,
            next_item_id: order.next_item_id,
            r_x: seq_index * link_length + margin,
            r_y:
              push_place(
                orders_by_seq.length,
                order_index,
                data.groups[order.order_type].length
              ) -
              (60 * (data.groups[order.order_type].length - 1)) / 2 +
              60 * index,
          });
        });
        // placeを定義
        place.push({
          r_x: seq_index * link_length + margin,
          r_y: push_place(
            orders_by_seq.length,
            order_index,
            data.groups[order.order_type].length
          ),
        });
      } else {
        graph.orders.push({
          ...order,
          r_x: seq_index * link_length + margin,
          r_y: push_place(orders_by_seq.length, order_index),
        });
        // placeを定義
        place.push({
          r_x: seq_index * link_length + margin,
          r_y: push_place(orders_by_seq.length, order_index),
        });
      }
      if (order.next_item_id[0] !== -1) {
        // graph2.nodes.push(order);
        // linksとa_lineを定義
        order.next_item_id.forEach((id) => {
          graph.links.push({
            source: order.id,
            target: id,
            value: 40,
          });
          // graph2.links.push({
          //   source: order.id,
          //   target: id,
          //   value: 20,
          // });
          // graph2.links.push({
          //   source: order.id,
          //   target: id,
          //   value: 1,
          // });
          // a_line
          a_line.push({
            source: order.id,
            target: id,
          });
        });
      }

      // パス1について
      // data.order1[seq_index].forEach((order1, order1_index) => {
      //   if (JSON.stringify(order) == JSON.stringify(order1)) {
      //     graph3.nodes.push(order1);
      //     place2.push({
      //       r_x: seq_index * link_length + margin,
      //       r_y: push_place(orders_by_seq.length, order_index),
      //     });
      //     if (seq_index < data.order1.length - 1) {
      //       a_line2.push({
      //         source: seq_index,
      //         target: graph3.nodes.length,
      //       });
      //     }
      //   }
      // });

      // パス2について
      // data.order2[seq_index].forEach((order2, order2_index) => {
      //   if (JSON.stringify(order) == JSON.stringify(order2)) {
      //     graph4.nodes.push(order2);
      //     place3.push({
      //       r_x: seq_index * link_length + margin,
      //       r_y: push_place(orders_by_seq.length, order_index),
      //     });
      //     if (seq_index < data.order2.length - 1) {
      //       // graph4.links.push({
      //       //   source: seq_index,
      //       //   target: graph4.nodes.length,
      //       //   value: data.Pnum[1].value,
      //       // });
      //       a_line3.push({
      //         source: seq_index,
      //         target: graph4.nodes.length,
      //       });
      //     }
      //   }
      // });
    });
    // height_sを定義
    if (max_order_length < orders_by_seq.length) {
      height_s =
        push_place(orders_by_seq.length, 0) -
        push_place(orders_by_seq.length, orders_by_seq.length);
      max_order_length = orders_by_seq.length;
    }
  });

  console.log(JSON.parse(JSON.stringify(graph)));
  console.log(JSON.parse(JSON.stringify(place)));
  console.log(JSON.parse(JSON.stringify(a_line)));

  // graph3.links = [
  //   { source: 0, target: 1, value: 35, precision: "" },
  //   { source: 1, target: 2, value: 72, precision: "", factor: "入院歴なし" },
  //   { source: 2, target: 3, value: 51, precision: "" },
  //   { source: 3, target: 4, value: 21, precision: "" },
  //   { source: 4, target: 5, value: 59, precision: "" },
  //   { source: 5, target: 6, value: 25, precision: "" },
  //   { source: 6, target: 7, value: 67, precision: "" },
  // ];

  // graph4.links = [
  //   { source: 0, target: 1, value: 35, precision: "" },
  //   { source: 1, target: 2, value: 65, precision: "", factor: "入院歴あり" },
  //   { source: 2, target: 3, value: 33, precision: "" },
  //   { source: 3, target: 4, value: 21, precision: "" },
  //   { source: 4, target: 5, value: 59, precision: "" },
  //   { source: 5, target: 6, value: 25, precision: "" },
  //   { source: 6, target: 7, value: 67, precision: "" },
  // ];

  IR.sort(function (a, b) {
    return a.value < b.value ? -1 : 1;
  });

  SR.sort(function (a, b) {
    return a.value < b.value ? -1 : 1;
  });

  LOS.sort(function (a, b) {
    return a.value < b.value ? -1 : 1;
  });

  Cost.sort(function (a, b) {
    return a.value < b.value ? -1 : 1;
  });

  const pathnum = data.Pnum.length;
  let Pnumsum = 0;
  for (var i = 0; i < data.Pnum.length; i++) {
    Pnumsum += data.Pnum[i].value;
  }
  //Set up the color scale
  const color = d3.scale.category10();
  const color2 = d3.scale.category20();
  for (let i = 0; i < 10; i++) {
    color(String(i));
  }
  for (let i = 0; i < 20; i++) {
    color2(String(i));
  }

  //Append a SVG to the body of the html page. Assign this SVG as an object to svg
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  //
  //
  //sankeyチャートの表示

  const units = "人";
  const formatNumber = d3.format(",.0f"), // zero decimal places
    format = function (d: number) {
      return formatNumber(d) + " " + units;
    };

  // append the svg canvas to the page
  const sankey1 = sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([data.order_all.length * link_length + 110, height_s]);

  const sankey2 = sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([data.order_all.length * link_length + 110, height_s]);

  const sankey3 = sankey()
    .nodeWidth(36)
    .nodePadding(40)
    .size([data.order_all.length * link_length + 110, height_s]);

  const path1 = function () {
    let curvature = 0.5;

    function link(d: LinksType, i: number) {
      const x0 = pop_place(find_link(i).source).r_x,
        x1 = pop_place(find_link(i).target).r_x,
        xi = d3.interpolateNumber(x0, x1),
        x2 = xi(curvature),
        x3 = xi(1 - curvature),
        y0 = pop_place(find_link(i).source).r_y,
        y1 = pop_place(find_link(i).target).r_y;
      return (
        "M" +
        x0 +
        "," +
        y0 +
        "C" +
        x2 +
        "," +
        y0 +
        " " +
        x3 +
        "," +
        y1 +
        " " +
        x1 +
        "," +
        y1
      );
    }

    link.curvature = function (_: number) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // 上側のパスの座標定義
  // const path2 = function () {
  //   let curvature = 0.5;
  //   function link(d: LinksType, i: number) {
  //     const x0 = pop_place2(find_link1(i).source).r_x,
  //       x1 = pop_place2(find_link1(i).target).r_x,
  //       xi = d3.interpolateNumber(x0, x1),
  //       x2 = xi(curvature),
  //       x3 = xi(1 - curvature),
  //       y0 = pop_place2(find_link1(i).source).r_y,
  //       // - circle_r + circle_r * 0.7,
  //       y1 = pop_place2(find_link1(i).target).r_y;
  //     // - circle_r + circle_r * 0.7;
  //     return (
  //       "M" +
  //       x0 +
  //       "," +
  //       y0 +
  //       "C" +
  //       x2 +
  //       "," +
  //       y0 +
  //       " " +
  //       x3 +
  //       "," +
  //       y1 +
  //       " " +
  //       x1 +
  //       "," +
  //       y1
  //     );
  //   }

  //   link.curvature = function (_: number) {
  //     if (!arguments.length) return curvature;
  //     curvature = +_;
  //     return link;
  //   };

  //   return link;
  // };

  // 下側のパスの座標定義
  // const path3 = function () {
  //   let curvature = 0.5;

  //   function link(d: LinksType, i: number) {
  //     const x0 = pop_place3(find_link2(i).source).r_x,
  //       x1 = pop_place3(find_link2(i).target).r_x,
  //       xi = d3.interpolateNumber(x0, x1),
  //       x2 = xi(curvature),
  //       x3 = xi(1 - curvature),
  //       y0 = pop_place3(find_link2(i).source).r_y,
  //       // + circle_r - circle_r * 0.3,
  //       y1 = pop_place3(find_link2(i).target).r_y;
  //     // + circle_r - circle_r * 0.3;
  //     return (
  //       "M" +
  //       x0 +
  //       "," +
  //       y0 +
  //       "C" +
  //       x2 +
  //       "," +
  //       y0 +
  //       " " +
  //       x3 +
  //       "," +
  //       y1 +
  //       " " +
  //       x1 +
  //       "," +
  //       y1
  //     );
  //   }

  //   link.curvature = function (_: number) {
  //     if (!arguments.length) return curvature;
  //     curvature = +_;
  //     return link;
  //   };

  //   return link;
  // };

  // sankey1.nodes(graph2.nodes).links(graph2.links).layout(32);

  // sankey2
  //   .nodes(graph3.nodes)
  //   .links(graph3.links)
  //   .layout(32);

  // sankey3
  //   .nodes(graph4.nodes)
  //   .links(graph4.links)
  //   .layout(32);

  // add in the links
  /*   //すべてのバリアントパターン
      var link0 = svg.append("g").selectAll(".link0")
          .data(graph2.links)
        .enter().append("path")
          .attr("class", "link0")
          .attr("d", path)
       // .attr("stroke" , "red")
          .style("stroke-width", function(d) { return Math.max(1, circle_r); }) //maxの中身は頻出シーケンスの数によって変える
          .sort(function(a, b) { return b.dy - a.dy; });    	  
    
    // add the link titles
      link0.append("title")
            .text(function(d) {
            return d.source.order_type + " → " + 
                    d.target.order_type + "\n" + format(d.value); }); */

  // 上側のパスを出力
  const link1_data = svg
    .append("g")
    .selectAll(".link1")
    .data(graph.links)
    .enter();
  const link1 = link1_data
    .append("path")
    .attr("class", "link1")
    .attr("d", path1())
    .attr("stroke", function (d) {
      const rgb = 255 - 1.2 * d.value;
      return `rgb(${rgb}, ${rgb}, ${rgb})`;
    })
    // .attr("stroke-opacity", .7)
    .style("stroke-width", function (d) {
      return Math.max(
        1,
        circle_r * 2
        // ((circle_r * 2 * data.Pnum[0].value) / Pnumsum) * 2 * 0.7
      );
    })
    .attr("fill", "none");
  // .sort(function (a, b) {
  //   return b.dy - a.dy;
  // });

  //Set up the force layout
  const force = d3.layout.force().linkDistance(80).size([width, height]);

  // force.nodes(graph.orders).links(graph.links).start();

  // add the link titles
  link1.append("title").text(function (d) {
    return (
      "Seq:" +
      data.Pnum[0].seq +
      "\n" +
      graph.orders[d.source].order_type +
      " → " +
      graph.orders[d.target].order_type +
      "\n" +
      format(d.value)
    );
  });

  link1_data
    .append("text")
    .attr("class", "link1_text")
    .attr("font-size", 15)
    .style("text-anchor", "middle")
    .style("dominant-baseline", "central")
    .text(function (d) {
      if (d.factor) return d.factor;
      return "";
    });

  // 下側のパスを出力
  // const link2_data = svg
  //   .append("g")
  //   .selectAll(".link2")
  //   .data(graph4.links)
  //   .enter();
  // const link2 = link2_data
  //   .append("path")
  //   .attr("class", "link2")
  //   .attr("d", path3())
  //   .attr("stroke", function (d) {
  //     const rgb = 255 - 1.2 * d.value;
  //     return `rgb(${rgb}, ${rgb}, ${rgb})`;
  //   })
  //   // .attr("stroke-opacity", .7)
  //   .style("stroke-width", function (d) {
  //     return Math.max(1, circle_r * 2);
  //     // (circle_r * 2 * data.Pnum[1].value) / Pnumsum) * 2 * 0.3
  //   })
  //   .attr("fill", "none");
  // // .sort(function (a, b) {
  // //   return b.dy - a.dy;
  // // });

  // // add the link titles
  // link2.append("title").text(function (d) {
  //   return (
  //     "Seq:" +
  //     data.Pnum[1].seq +
  //     "\n" +
  //     graph.orders[d.source].order_type +
  //     " → " +
  //     graph.orders[d.target].order_type +
  //     "\n" +
  //     format(d.value)
  //   );
  // });

  // link2_data
  //   .append("text")
  //   .attr("class", "link2_text")
  //   .attr("font-size", 15)
  //   .style("text-anchor", "middle")
  //   .style("dominant-baseline", "central")
  //   .text(function (d) {
  //     if (d.factor) return d.factor;
  //     return "";
  //   });

  // add in the nodes
  /*   var node0 = svg.append("g").selectAll(".node0")
          .data(graph2.nodes)
        .enter().append("g")
          .attr("class", "node0")
          .attr("transform", function(d,i) { 
          return "translate(" + (pop_place(i).r_x) + "," + (pop_place(i).r_y) + ")"; }); */

  // add the rectangles for the nodes
  /*   node0.append("rect")
          .attr("height", function(d) { return d.dy; })
          .attr("width", sankey.nodeWidth())
          .style("fill", function(d) { 
          return d.color = color(colorset(d.order_type)); })
          .style("stroke", function(d) { 
          return d3.rgb(d.color).darker(2); })
        .append("title")
          .text(function(d) { 
          return d.order_type + "\n" + format(d.value); });
    
    // add in the title for the nodes
      node0.append("text")
          .attr("x", -6)
          .attr("y", function(d) { return d.dy / 2; })
          .attr("dy", ".35em")
          .attr("text-anchor", "end")
          .attr("transform", null)
          .text(function(d) { return d.order_type; })
        .filter(function(d) { return d.x < width / 2; })
          .attr("x", 6 + sankey.nodeWidth())
          .attr("text-anchor", "start"); */

  //
  //
  //sankeyの終了

  //Create all the line svgs but without locations yet
  // var link = svg
  //   .selectAll(".link")
  //   .data(graph.links)
  //   .enter()
  //   .append("line")
  //   .attr("class", "link")
  //   .attr("id", function (d, i) {
  //     return i;
  //   })
  //   .style("marker-end", "url(#suit)"); //Added

  //Do the same with the circles for the nodes - no
  const node = svg
    .selectAll(".node")
    .data(graph.orders)
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("id", function (d, i) {
      return i;
    })
    .on("click", function (this: EventTarget) {
      if (
        d3.select(this).select(".info_text1").style("visibility") == "visible"
      ) {
        d3.select(this).select(".info_text1").style("visibility", "hidden");
        d3.select(this).select(".info_text2").style("visibility", "hidden");
        d3.select(this).select(".info_text3").style("visibility", "hidden");
        d3.select(this).select(".info_rect").style("visibility", "hidden");
      } else if (
        d3.select(this).select(".info_text1").style("visibility") == "hidden"
      ) {
        d3.select(this).select(".info_text1").style("visibility", "visible");
        d3.select(this).select(".info_text2").style("visibility", "visible");
        d3.select(this).select(".info_text3").style("visibility", "visible");
        d3.select(this).select(".info_rect").style("visibility", "visible");
      }
    });
  node
    .append("circle")
    .attr("r", circle_r)
    .style("fill", function (d, i) {
      return color(String(colorset(d.order_type)));
    })
    .attr("cx", function (d, i) {
      return d.r_x;
    })
    .attr("cy", function (d, i) {
      return d.r_y;
    });

  node
    .append("text")
    .attr("class", "node_text")
    .attr("font-size", 12)
    .style("text-anchor", "middle")
    .text(function (d) {
      return "[" + d.order_type + "/ day : " + d.day + "]";
    })
    .attr("x", function (d, i) {
      return d.r_x;
    })
    .attr("y", function (d, i) {
      return d.r_y - 30;
    });

  node
    .append("rect")
    .style("visibility", "hidden")
    .style("fill", function (d, i) {
      return color(String(colorset(d.order_type)));
    })
    .attr("class", "info_rect")
    .attr("fill-opacity", ".7")
    .attr("width", 200)
    .attr("height", 80)
    .attr("stroke", "black")
    .attr("stroke-width", "0.5pt")
    .attr("x", function (d, i) {
      return d.r_x - 105;
    })
    .attr("y", function (d, i) {
      return d.r_y - 120;
    });

  node
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "info_text1")
    .attr("font-size", 15)
    .text(function (d) {
      return d.order_explain;
    })
    .style("text-anchor", "middle")
    .attr("x", function (d, i) {
      return d.r_x;
    })
    .attr("y", function (d, i) {
      return d.r_y - 100;
    });

  node
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "info_text2")
    .attr("font-size", 15)
    .text(function (d) {
      if (d.order_name == "") return "null";
      return d.order_name;
    })
    .style("text-anchor", "middle")
    .attr("x", function (d, i) {
      return d.r_x;
    })
    .attr("y", function (d, i) {
      return d.r_y - 80;
    });

  node
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "info_text3")
    .attr("font-size", 15)
    .text(function (d) {
      if (d.code == "") return "null";
      return d.code;
    })
    .style("text-anchor", "middle")
    .attr("x", function (d, i) {
      return d.r_x;
    })
    .attr("y", function (d, i) {
      return d.r_y - 60;
    });

  //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
  // force.on("tick", function () {
  //console.log(graph.orders[0].type)
  //next_node(this_node)が必要
  // link
  //   .attr("x1", function (d, i) {
  //     return pop_place(find_link(i).source).r_x;
  //   })
  //   .attr("y1", function (d, i) {
  //     return pop_place(find_link(i).source).r_y;
  //   })
  //   .attr("x2", function (d, i) {
  //     return pop_place(find_link(i).target).r_x - circle_r;
  //   })
  //   .attr("y2", function (d, i) {
  //     return pop_place(find_link(i).target).r_y;
  //   });

  //---Insert-------
  svg
    .append("defs")
    .selectAll("marker")
    .data(["suit", "licensing", "resolved"])
    .enter()
    .append("marker")
    .attr("id", function (d) {
      return d;
    })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("markerWidth", 50)
    .attr("markerHeight", 10)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
    .style("stroke", "black");

  function push_place(parallel: number, j: number, group_num?: number) {
    const c_line = height / 2;
    if (parallel == 1) {
      return c_line;
    }

    if (parallel % 2 == 0) {
      if (j < parallel / 2)
        return c_line + 75 + 150 * (j - parallel / 2) - (group_num ?? 0) * 15;
      else
        return c_line + 75 - 150 * (parallel / 2 - j) + (group_num ?? 0) * 15;
    } else {
      parallel = parallel - 1;
      if (j < parallel / 2) return c_line + 150 + 150 * (j - parallel / 2);
      else return c_line + 150 - 150 * (parallel / 2 - j);
    }
    return 100;
  }

  function pop_place(id: number) {
    return place[id];
  }

  function find_link(id: number) {
    return a_line[id];
  }

  // function pop_place2(id: number) {
  //   return place2[id];
  // }

  // function find_link1(id: number) {
  //   return a_line2[id];
  // }

  // function pop_place3(id: number) {
  //   return place3[id];
  // }

  // function find_link2(id: number) {
  //   return a_line3[id];
  // }

  function colorset(type: string) {
    //nodeの色の決定
    if (type == "処方") {
      return 1;
    } else if (type == "生理検査") {
      return 2;
    } else if (type == "検体検査") {
      return 3;
    } else if (type == "看護タスク") {
      return 4;
    } else if (type == "手術") {
      return 5;
    } else if (type == "注射") {
      return 6;
    } else if (type == "クロスマッチ（Ｔ＆Ｓ）検査") {
      return 7;
    } else if (type == "服薬指導") {
      return 8;
    } else if (type == "血液型関連検査") {
      return 9;
    } else {
      return 0;
    }
  }

  function colorset2(seqno: number) {
    //seqの色の決定
    if (seqno % 10 == 1) {
      return 1;
    } else if (seqno % 10 == 2) {
      return 2;
    } else if (seqno % 10 == 3) {
      return 3;
    } else if (seqno % 10 == 4) {
      return 4;
    } else if (seqno % 10 == 5) {
      return 5;
    } else if (seqno % 10 == 6) {
      return 6;
    } else if (seqno % 10 == 7) {
      return 7;
    } else if (seqno % 10 == 8) {
      return 8;
    } else if (seqno % 10 == 9) {
      return 9;
    } else {
      return 0;
    }
  }

  d3.select("#clearButton").on("click", function () {
    d3.selectAll(".info_rect").style("visibility", "hidden");
    d3.selectAll(".info_text1").style("visibility", "hidden");
    d3.selectAll(".info_text2").style("visibility", "hidden");
    d3.selectAll(".info_text3").style("visibility", "hidden");
    d3.selectAll(".risk1_text").style("visibility", "hidden");
    d3.selectAll(".risk1_rect").style("visibility", "hidden");
    d3.selectAll(".risk2_text").style("visibility", "hidden");
    d3.selectAll(".risk2_rect").style("visibility", "hidden");
    d3.selectAll(".cost1_text").style("visibility", "hidden");
    d3.selectAll(".cost1_rect").style("visibility", "hidden");
    d3.selectAll(".cost2_text").style("visibility", "hidden");
    d3.selectAll(".cost2_rect").style("visibility", "hidden");
    d3.selectAll(".rect1").style("visibility", "hidden");
    d3.selectAll(".rect2").style("visibility", "hidden");
    d3.selectAll(".rect3").style("visibility", "hidden");
    d3.selectAll(".rect4").style("visibility", "hidden");
    d3.selectAll(".text1").style("visibility", "hidden");
    d3.selectAll(".text2").style("visibility", "hidden");
    d3.selectAll(".text3").style("visibility", "hidden");
    d3.selectAll(".text4").style("visibility", "hidden");
    d3.selectAll(".risk1_ptext").style("visibility", "hidden");
    d3.selectAll(".risk2_ptext").style("visibility", "hidden");
    d3.selectAll(".cost1_ptext").style("visibility", "hidden");
    d3.selectAll(".cost2_ptext").style("visibility", "hidden");
  });
  //---End Insert---

  const rect1 = svg
    .append("rect")
    .attr("class", "rect1")
    .style("visibility", "hidden")
    .attr("x", 5)
    .attr("y", 5)
    .attr("width", 240)
    .attr("height", 120)
    .attr("fill", "black")
    .attr("fill-opacity", ".1")
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  const text1 = svg
    .append("text")
    .attr("class", "text1")
    .style("visibility", "hidden")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", 10)
    .attr("y", 25)
    .text("併発症発生リスク");

  const risk1 = svg
    .selectAll(".risk1")
    .data(IR)
    .enter()
    .append("g")
    .attr("transform", "translate(0,25)");

  d3.select("#displayRisk1")
    .on("click", function () {
      d3.select(".rect1").style("visibility", "visible");
      d3.select(".text1").style("visibility", "visible");
      risk1.select(".risk1_text").style("visibility", "visible");
      risk1.select(".risk1_ptext").style("visibility", "visible");
    })
    .on("dblclick", function () {
      d3.select(".rect1").style("visibility", "hidden");
      d3.select(".text1").style("visibility", "hidden");
      risk1.select(".risk1_text").style("visibility", "hidden");
      risk1.select(".risk1_ptext").style("visibility", "hidden");
    });

  risk1
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "risk1_text")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", function (d, i) {
      return 10;
    })
    .attr("y", function (d, i) {
      return i * 20 + 25;
    })
    .text(function (d, i) {
      return "Seq" + d.seq + ": " + d.value;
    })
    .style("fill", function (d, i) {
      return color2(String(colorset2(d.seq)));
    });

  risk1
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "risk1_ptext")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", 10)
    .attr("y", IR.length * 20 + 25)
    .text("P値:" + Statistics.value.IRP + "(" + Statistics.result.IRSD + ")");

  const rect2 = svg
    .append("rect")
    .attr("class", "rect2")
    .style("visibility", "hidden")
    .attr("x", 245)
    .attr("y", 5)
    .attr("width", 240)
    .attr("height", 120)
    .attr("fill", "black")
    .attr("fill-opacity", ".1")
    .attr("stroke", "black")
    .attr("stroke-width", 2);
  const text2 = svg
    .append("text")
    .attr("class", "text2")
    .style("visibility", "hidden")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", 250)
    .attr("y", 25)
    .text("重篤度を考慮したリスク");

  const risk2 = svg
    .selectAll(".risk2")
    .data(SR)
    .enter()
    .append("g")
    .attr("transform", "translate(0,25)");

  d3.select("#displayRisk2")
    .on("click", function () {
      d3.select(".rect2").style("visibility", "visible");
      d3.select(".text2").style("visibility", "visible");
      risk2.select(".risk2_text").style("visibility", "visible");
      risk2.select(".risk2_ptext").style("visibility", "visible");
    })
    .on("dblclick", function () {
      d3.select(".rect2").style("visibility", "hidden");
      d3.select(".text2").style("visibility", "hidden");
      risk2.select(".risk2_text").style("visibility", "hidden");
      risk2.select(".risk2_ptext").style("visibility", "hidden");
    });

  risk2
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "risk2_text")
    .attr("font-size", 15)
    .attr("x", function (d, i) {
      return 250;
    })
    .attr("y", function (d, i) {
      return i * 20 + 25;
    })
    .text(function (d, i) {
      return "Seq" + d.seq + ": " + d.value;
    })
    .attr("font-weight", "bold")
    .style("fill", function (d, i) {
      return color2(String(colorset2(d.seq)));
    });

  risk2
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "risk2_ptext")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", 250)
    .attr("y", SR.length * 20 + 25)
    .text("P値:" + Statistics.value.SRP + "(" + Statistics.result.SRSD + ")");

  const rect3 = svg
    .append("rect")
    .attr("class", "rect3")
    .style("visibility", "hidden")
    .attr("x", 485)
    .attr("y", 5)
    .attr("width", 240)
    .attr("height", 120)
    .attr("fill", "black")
    .attr("fill-opacity", ".1")
    .attr("stroke", "black")
    .attr("stroke-width", 2);
  const text3 = svg
    .append("text")
    .attr("class", "text3")
    .style("visibility", "hidden")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", 490)
    .attr("y", 25)
    .text("在院日数");

  const cost1 = svg
    .selectAll(".cost1")
    .data(LOS)
    .enter()
    .append("g")
    .attr("transform", "translate(0,25)");

  d3.select("#displayCost1")
    .on("click", function () {
      d3.select(".rect3").style("visibility", "visible");
      d3.select(".text3").style("visibility", "visible");
      cost1.select(".cost1_text").style("visibility", "visible");
      cost1.select(".cost1_ptext").style("visibility", "visible");
    })
    .on("dblclick", function () {
      d3.select(".rect3").style("visibility", "hidden");
      d3.select(".text3").style("visibility", "hidden");
      cost1.select(".cost1_text").style("visibility", "hidden");
      cost1.select(".cost1_ptext").style("visibility", "hidden");
    });

  cost1
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "cost1_text")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", function (d, i) {
      return 490;
    })
    .attr("y", function (d, i) {
      return i * 20 + 25;
    })
    .text(function (d, i) {
      return "Seq" + d.seq + ": " + d.value;
    })
    .style("fill", function (d, i) {
      return color2(String(colorset2(d.seq)));
    });

  cost1
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "cost1_ptext")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", 490)
    .attr("y", LOS.length * 20 + 25)
    .text("P値:" + Statistics.value.LOSP + "(" + Statistics.result.LOSSD + ")");

  const rect4 = svg
    .append("rect")
    .attr("class", "rect4")
    .style("visibility", "hidden")
    .attr("x", 725)
    .attr("y", 5)
    .attr("width", 240)
    .attr("height", 120)
    .attr("fill", "black")
    .attr("fill-opacity", ".1")
    .attr("stroke", "black")
    .attr("stroke-width", 2);
  const text4 = svg
    .append("text")
    .attr("class", "text4")
    .style("visibility", "hidden")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", 730)
    .attr("y", 25)
    .text("費用");

  const cost2 = svg
    .selectAll(".cost2")
    .data(Cost)
    .enter()
    .append("g")
    .attr("transform", "translate(0,25)");

  d3.select("#displayCost2")
    .on("click", function () {
      d3.select(".rect4").style("visibility", "visible");
      d3.select(".text4").style("visibility", "visible");
      cost2.select(".cost2_text").style("visibility", "visible");
      cost2.select(".cost2_ptext").style("visibility", "visible");
    })
    .on("dblclick", function () {
      d3.select(".rect4").style("visibility", "hidden");
      d3.select(".text4").style("visibility", "hidden");
      cost2.select(".cost2_text").style("visibility", "hidden");
      cost2.select(".cost2_ptext").style("visibility", "hidden");
    });

  cost2
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "cost2_text")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", function (d, i) {
      return 730;
    })
    .attr("y", function (d, i) {
      return i * 20 + 25;
    })
    .text(function (d, i) {
      return "Seq" + d.seq + ": " + d.value;
    })
    .style("fill", function (d, i) {
      return color2(String(colorset2(d.seq)));
    });

  cost2
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "cost2_ptext")
    .attr("font-size", 15)
    .attr("font-weight", "bold")
    .attr("x", 730)
    .attr("y", Cost.length * 20 + 25)
    .text(
      "P値:" + Statistics.value.COSTP + "(" + Statistics.result.COSTSD + ")"
    );
});
