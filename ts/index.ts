//Constants for the SVG
import * as d3 from "d3";
import { sankey } from "d3-sankey";
import data from "../dist/data.json";
import patientData from "../dist/patient3.json";

const Data: JSONDataType = data;
const PatientData: PatientOrderDataType[] = patientData.patient_orders;

interface JSONDataType {
  order_all: OrderDataType[];
  groups: { [key: string]: GroupOrderDataType[] };
}

interface OrderDataType {
  id: number;
  order_type: string;
  order_explain: string;
  order_name: string;
  code: string;
  day: string;
  frequency: number;
  next_item_id: Array<number>;
  pre_item_id: Array<number>;
  factor?: string[];
  time_interval?: number[];
  isGroup?: boolean;
  isInjection?: boolean;
}

interface GroupOrderDataType {
  order_type: string;
  order_explain: string;
  order_name: string;
  code: string;
  day: string;
}

interface PatientOrderDataType {
  patientid: string;
  orderno: string;
  ordertypevalue: string;
  orderexplain: string;
  enforcedinfodate: string;
  inhospdate: string;
  leavehospdate: string;
  productname: string;
  nowprice: string;
  postprice: string;
  efficacycode: string;
  efficacy: string;
  enforcedinfotime: string;
}

interface OrderType extends OrderDataType {
  r_x: number;
  r_y: number;
}

interface PlaceType {
  id: number;
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
  const circle_r = 23;
  const link_length = 203; //文字が重なる場合はここの値を変更
  const margin = 110; // 全体が入るようにノードを右にずらす
  let width = N1 * (link_length + circle_r) + 500; // 最終的に右端のノードに合わせる
  const height = 1000;
  const graph: { orders: OrderType[]; links: LinksType[] } = {
    orders: [],
    links: [],
  };
  const graph2: { orders: OrderType[]; links: LinksType[] } = {
    orders: [],
    links: [],
  };

  const place: PlaceType[] = []; //nodeの中心位置を記録する{r_x,r_y}
  const place2: PlaceType[] = []; //nodeの中心位置を記録する{r_x,r_y}
  // const a_line: LineType[] = [];

  const dataTypes4Color: String[] = [];

  let height_s = 0;

  let isRecommend: boolean = false;

  const find_order_by_id = (id: number): OrderDataType | undefined => {
    return data.order_all.find((order) => order.id == id);
  };

  const x_place = (
    pre_item_ids: number[],
    time_interval: number[] | undefined
  ) => {
    const pre_item =
      pre_item_ids.length === 1
        ? place.find((p) => p.id == pre_item_ids[0])
        : pre_item_ids.map((pre_item_id) =>
            place.find((p) => p.id == pre_item_id)
          );
    if (!pre_item) {
      return link_length;
    } else if (Array.isArray(pre_item)) {
      // return pre_item.r_x + link_length;
      const ave_time_interval = time_interval?.reduce((acc, cur) => acc + cur);
      return (
        pre_item[0]!.r_x +
        (ave_time_interval
          ? (ave_time_interval / time_interval!.length) * 0.6 +
            link_length * 0.4
          : link_length)
      );
    } else {
      return (
        pre_item.r_x +
        (time_interval
          ? time_interval[0] * 0.6 + link_length * 0.4
          : link_length)
      );
    }
  };

  const push_graph_orders = (
    id: number,
    seq_number: number,
    seq_length: number,
    seq_index: number
  ): void => {
    if (id == -1) {
      width = place[place.length - 1].r_x + margin;
      return;
    }
    const order = data.order_all.find((order) => order.id == id);
    if (!order) return;
    if (graph.orders.find((order) => order.id == id)) return;
    // グループの場合
    if (order.isGroup) {
      // パスが通る座標
      place.push({
        id: order.id,
        r_x: x_place(order.pre_item_id, order.time_interval),
        r_y: push_place(
          seq_length,
          seq_index,
          order.pre_item_id,
          data.groups[order.order_type].length
        ),
      });
      data.groups[order.order_type].forEach((_order, index) => {
        // 各オーダーが通る座標
        graph.orders.push({
          ..._order,
          id: order.id,
          frequency: order.frequency,
          next_item_id: order.next_item_id,
          pre_item_id: order.pre_item_id,
          r_x: x_place(order.pre_item_id, order.time_interval),
          r_y:
            push_place(
              seq_length,
              seq_index,
              order.pre_item_id,
              data.groups[order.order_type].length
            ) -
            (60 * (data.groups[order.order_type].length - 1)) / 2 +
            60 * index,
        });
      });
      // 普通のオーダーの場合
    } else {
      // パスが通る座標
      place.push({
        id: order.id,
        r_x: x_place(order.pre_item_id, order.time_interval),
        r_y: push_place(seq_length, seq_index, order.pre_item_id),
      });
      // 各オーダーが通る座標
      graph.orders.push({
        ...order,
        r_x: x_place(order.pre_item_id, order.time_interval),
        r_y: push_place(seq_length, seq_index, order.pre_item_id),
      });
    }

    order.next_item_id.forEach((next_item_id, next_index) => {
      push_graph_orders(
        next_item_id,
        seq_number + 1,
        order.next_item_id.length,
        next_index
      );
    });
  };

  data.order_all.forEach((orders_by_seq, seq_index) => {
    // placeとgraph.ordersを定義
    push_graph_orders(0, 0, 1, 1);

    if (orders_by_seq.next_item_id[0] !== -1) {
      // linksを定義
      orders_by_seq.next_item_id.forEach((id, index) => {
        graph.links.push({
          source: orders_by_seq.id,
          target: id,
          value: 40,
          factor: orders_by_seq.factor ? orders_by_seq.factor[index] : "",
        });
      });
    }

    // height_sを定義
    // if (max_order_length < orders_by_seq.length) {
    //   height_s =
    //     push_place(orders_by_seq.length, 0) -
    //     push_place(orders_by_seq.length, orders_by_seq.length);
    //   max_order_length = orders_by_seq.length;
    // }
    height_s = 300;
  });

  PatientData.forEach((order, index) => {
    place2.push({
      id: index,
      r_x: link_length * (index + 1),
      r_y: height * 0.7,
    });

    graph2.orders.push({
      id: index,
      order_type: order.ordertypevalue,
      order_explain: order.orderexplain,
      order_name: order.productname,
      code: order.efficacycode,
      day: "",
      frequency: 100,
      pre_item_id: [index - 1],
      next_item_id: PatientData[index + 1] ? [index + 1] : [-1],
      r_x: link_length * (index + 1),
      r_y: height * 0.7,
    });

    if (PatientData[index + 1]) {
      graph2.links.push({
        source: index,
        target: index + 1,
        value: 40,
      });
    }

    if (width < link_length * (index + 1)) {
      width = link_length * (index + 1) + margin;
    }
  });

  const allPathId: number[][] = [];

  const getAllPathId = (id: number, arr: number[]) => {
    const targetOrder = data.order_all.find((order) => order.id == id);
    if (!targetOrder) {
      return allPathId.push(arr.concat());
    }
    arr.push(id);
    targetOrder?.next_item_id.forEach((id) => {
      getAllPathId(id, arr.concat());
    });
  };

  getAllPathId(0, []);

  console.log(allPathId.concat());

  console.log(JSON.parse(JSON.stringify(graph)));
  console.log(JSON.parse(JSON.stringify(place)));

  console.log(JSON.parse(JSON.stringify(graph2)));
  console.log(JSON.parse(JSON.stringify(place2)));

  const patientPath = [];
  let i = 0;
  let j = 0;
  let i_progress_count = 0;
  let j_progress_count = 0;

  while (data.order_all[i] && PatientData[j]) {
    if (data.order_all[i].isGroup) {
      const groupOrders = data.groups[data.order_all[i].order_type];
    }
    if (data.order_all[i].order_type === PatientData[j].ordertypevalue) {
      patientPath.push(data.order_all[i].id);
      i++;
      j++;
      i_progress_count = 0;
      j_progress_count = 0;
      continue;
    } else {
      if (
        PatientData[j + 1]?.ordertypevalue === data.order_all[i]?.order_type
      ) {
        j++;
        j_progress_count++;
      } else if (
        data.order_all[i + 1]?.order_type === data.order_all[j]?.order_type
      ) {
        i++;
        i_progress_count++;
      } else {
        j++;
      }
    }
  }

  console.log("patientpath");
  console.log(patientPath.concat());

  function getAllPathName(
    path_id_array: Array<number>
  ): Array<string | string[]> {
    return path_id_array.map((id) => {
      const order = find_order_by_id(id)!;
      if (order.isGroup || order.isInjection) {
        const group_orders = data.groups[order.order_type];
        return group_orders.map((group_order) => group_order.order_type);
      } else {
        return order.order_type;
      }
    });
  }

  const passedPath = allPathId.reduce(
    (acc: Array<number>, cur: Array<number>) => {
      if (acc.length === 0) {
        acc = cur;
      }
      if (getConcordance(acc, PatientData) < getConcordance(cur, PatientData)) {
        acc = cur;
      }
      return acc;
    },
    [] as Array<number>
  );

  console.log("passedPath");

  console.log(passedPath);

  function getConcordance(
    all_path_array: Array<number>,
    patient_orders: PatientOrderDataType[]
  ) {
    const path_names = getAllPathName(all_path_array).flat();
    let count = 0;
    path_names.forEach((name) => {
      if (patient_orders.find((order) => order.ordertypevalue === name)) {
        count++;
      }
    });
    return count / path_names.length;
  }

  function getMatchPath(
    path_id_array: number[],
    patient_orders: PatientOrderDataType[]
  ) {
    const path_name_array = getAllPathName(path_id_array);
    let _i = 0;
    let _j = 1;
    const matchedPath = [0];
    while (path_name_array[_j]) {
      // console.log("_i: " + _i + " / _j: " + _j);
      if (!patient_orders[_i]) break;
      const path_name = path_name_array[_j];
      if (Array.isArray(path_name)) {
        const group_order = patient_orders.slice(_i, _i + path_name.length);
        if (
          JSON.stringify(path_name.sort()) ==
          JSON.stringify(
            group_order.map((order) => order.ordertypevalue).sort()
          )
        ) {
          console.log(path_name);
          matchedPath.push(path_id_array[_j]);
          _i += path_name.length;
          _j++;
          continue;
        } else if (
          path_name.every((name) =>
            patient_orders.find((order) => order.ordertypevalue === name)
              ? true
              : false
          )
        ) {
          console.log("~~~~");
          _i++;
        } else {
          // TODO
          matchedPath.push(path_id_array[_j]);
          _j++;
          continue;
        }
      } else {
        if (path_name === patient_orders[_i].ordertypevalue) {
          matchedPath.push(path_id_array[_j]);
          _i++;
          _j++;
          console.log(path_name);
          continue;
        } else if (
          // 頻出パスが多い、患者のパスが飛んでいる
          path_name_array.indexOf(patient_orders[_i].ordertypevalue) !== -1
        ) {
          const next_order_index = path_name_array.indexOf(
            patient_orders[_i + 1].ordertypevalue
          );
          if (
            next_order_index !== -1 &&
            path_name_array.indexOf(patient_orders[_i].ordertypevalue) <
              next_order_index
          ) {
            matchedPath.push(path_id_array[_j]);
            _j++;
            continue;
          } else {
            _i++;
          }
        } else if (
          patient_orders.find((order) => order.ordertypevalue === path_name)
        ) {
          _i++;
        } else {
          // matchedPath.push(path_id_array[_j]);
          _i++;
          _j++;
        }
      }
    }
    return matchedPath;
  }

  const matchedPath = getMatchPath(passedPath, PatientData);

  console.log(matchedPath);

  //Set up the color scale
  const color = d3.scale.category20();

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

  const path = function (pop_place: (id: number) => PlaceType | undefined) {
    let curvature = 0.5;

    function link(d: LinksType, i: number) {
      const x0 = pop_place(d.source)!.r_x,
        x1 = pop_place(d.target)!.r_x,
        xi = d3.interpolateNumber(x0, x1),
        x2 = xi(curvature),
        x3 = xi(1 - curvature),
        y0 = pop_place(d.source)!.r_y,
        y1 = pop_place(d.target)!.r_y;
      console.log("x0: " + x0 + " x1: " + x1 + " y0: " + y0 + " y1: " + y1);
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

  // パスを出力
  let link1_data = svg
    .append("g")
    .selectAll(".link1")
    .data(graph.links)
    .enter();
  const link1 = link1_data
    .append("path")
    .attr("class", "link1")
    .attr("id", function (d) {
      return `link${d.source}-${d.target}`;
    })
    .attr("d", path(pop_place))
    .attr("stroke", "#ccc")
    // .attr("stroke-opacity", .7)
    .style("stroke-width", function (d) {
      return Math.max(
        1,
        circle_r * 2
        // ((circle_r * 2 * data.Pnum[0].value) / Pnumsum) * 2 * 0.7
      );
    })
    .attr("fill", "none");

  link1_data
    .append("text")
    .attr("class", "link1_text")
    .attr("font-size", 15)
    .attr("x", function (d) {
      return (pop_place(d.source)!.r_x + pop_place(d.target)!.r_x) / 2;
    })
    .attr("y", function (d) {
      return (pop_place(d.source)!.r_y + pop_place(d.target)!.r_y) / 2;
    })
    .style("text-anchor", "middle")
    .style("dominant-baseline", "central")
    .text(function (d) {
      if (d.factor) return d.factor;
      return "";
    });

  let link2_data = svg
    .append("g")
    .selectAll(".link2")
    .data(graph2.links)
    .enter();

  // throw Error();
  const link2 = link2_data
    .append("path")
    .attr("class", "link2")
    .attr("id", function (d) {
      return `link2_${d.source}-${d.target}`;
    })
    .attr("d", path(pop_place2))
    .attr("stroke", "#ccc")
    // .attr("stroke-opacity", .7)
    .style("stroke-width", function (d) {
      return Math.max(
        1,
        circle_r * 2
        // ((circle_r * 2 * data.Pnum[0].value) / Pnumsum) * 2 * 0.7
      );
    })
    .attr("fill", "none");

  link2_data
    .append("text")
    .attr("class", "link2_text")
    .attr("font-size", 15)
    .attr("x", function (d) {
      return (pop_place2(d.source)!.r_x + pop_place2(d.target)!.r_x) / 2;
    })
    .attr("y", function (d) {
      return (pop_place2(d.source)!.r_y + pop_place2(d.target)!.r_y) / 2;
    })
    .style("text-anchor", "middle")
    .style("dominant-baseline", "central")
    .text(function (d) {
      if (d.factor) return d.factor;
      return "";
    });

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
    .attr("r", function (d) {
      return (d.frequency / 100) ** 1.2 * circle_r;
    })
    .style("fill", function (d, i) {
      return color(String(colorset(d.order_type)));
    })
    .attr("cx", function (d, i) {
      return d.r_x;
    })
    .attr("cy", function (d, i) {
      return d.r_y;
    })
    .append("title")
    .text(function (d) {
      return `出現率: ${d.frequency}%`;
    });

  node
    .append("text")
    .attr("class", "node_text")
    .attr("font-size", 13)
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

  const node2 = svg
    .selectAll(".node2")
    .data(graph2.orders)
    .enter()
    .append("g")
    .attr("class", "node2")
    .attr("id", function (d, i) {
      return `node2-${i}`;
    })
    .on("click", function (this: EventTarget) {
      if (
        d3.select(this).select(".info2_text1").style("visibility") == "visible"
      ) {
        d3.select(this).select(".info2_text1").style("visibility", "hidden");
        d3.select(this).select(".info2_text2").style("visibility", "hidden");
        d3.select(this).select(".info2_text3").style("visibility", "hidden");
        d3.select(this).select(".info2_rect").style("visibility", "hidden");
      } else if (
        d3.select(this).select(".info2_text1").style("visibility") == "hidden"
      ) {
        d3.select(this).select(".info2_text1").style("visibility", "visible");
        d3.select(this).select(".info2_text2").style("visibility", "visible");
        d3.select(this).select(".info2_text3").style("visibility", "visible");
        d3.select(this).select(".info2_rect").style("visibility", "visible");
      }
    });
  node2
    .append("circle")
    .attr("r", function (d) {
      return circle_r;
    })
    .style("fill", function (d, i) {
      return color(String(colorset(d.order_type)));
    })
    .attr("cx", function (d, i) {
      return d.r_x;
    })
    .attr("cy", function (d, i) {
      return d.r_y;
    })
    .append("title")
    .text(function (d) {
      return `出現率: ${d.frequency}%`;
    });

  node2
    .append("text")
    .attr("class", "node2_text")
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

  node2
    .append("rect")
    .style("visibility", "hidden")
    .style("fill", function (d, i) {
      return color(String(colorset(d.order_type)));
    })
    .attr("class", "info2_rect")
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

  node2
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "info2_text1")
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

  node2
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "info2_text2")
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

  node2
    .append("text")
    .style("visibility", "hidden")
    .attr("class", "info2_text3")
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

  function find_junction(orders: OrderDataType[]): OrderDataType {
    const new_orders = orders.map((order) => {
      let target = order;
      while (target.next_item_id.length == 1) {
        if (target.pre_item_id.length == 1) {
          target = find_order_by_id(target.pre_item_id[0])!;
        } else {
          //
        }
      }
      return target;
    });
    const uniq = [...new Set(new_orders)];
    if (uniq.length == 1) {
      console.log(uniq[0]);
      return uniq[0];
    } else {
      return find_junction(uniq);
    }
  }

  function push_place(
    parallel: number,
    j: number,
    pre_order_ids: number[],
    group_num?: number
  ) {
    let c_line = height * 0.36;

    if (pre_order_ids.length == 1) {
      const pre_order = place.find((order) => order.id == pre_order_ids[0]);
      if (!pre_order || pre_order.id == 0) return c_line;
      c_line = pre_order.r_y;
    } else if (pre_order_ids.length > 1) {
      let orders = pre_order_ids.map(
        (pre_order_id) => find_order_by_id(pre_order_id)!
      );
      const target_order = find_junction(orders);
      c_line = place.find((order) => order.id == target_order.id)!.r_y;
      console.log(c_line);
    }

    // const c_line = height / 2;
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
    return place.find((place) => place.id == id);
  }

  function pop_place2(id: number) {
    return place2.find((place) => place.id == id);
  }

  function find_link(id: number) {
    return graph.links[id];
  }

  function colorset(type: string) {
    //nodeの色の決定
    const number =
      dataTypes4Color.indexOf(type) !== -1
        ? dataTypes4Color.indexOf(type)
        : dataTypes4Color.push(type) - 1;
    return number;
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

  const branch_orders = data.order_all.filter((order) => {
    return order.next_item_id.length > 1;
  });

  const variants: LinksType[][] = [];

  const selection = [];

  branch_orders.forEach((branch_order) => {
    variants.push(
      graph.links.filter((rec_link) => rec_link.source == branch_order.id)
    );
  });

  passedPath.forEach((p, i) => {
    // if (!path[i + 1]) return;
    d3.select(`#link${p}-${passedPath[i + 1]}`).attr("stroke", "thistle");
  });

  matchedPath.forEach((p, i) => {
    // if (!path[i + 1]) return;
    d3.select(`#link${p}-${matchedPath[i + 1]}`).attr("stroke", "#bce2e8");
  });

  console.log(variants);
  const factors: LinksType[] = [];

  // variants.forEach((variant, index) => {
  //   console.log(variant);
  //   d3.select("#buttons")
  //     .selectAll(`button${index}`)
  //     .data(variant)
  //     .enter()
  //     .append("button")
  //     .text(function (d) {
  //       return d.factor ?? "";
  //     })
  //     .on("click", function (d) {
  //       selection.push(d.factor);
  //       const unselected_factors = variants
  //         .find((variant) => variant.includes(d))
  //         ?.filter((path) => path !== d);
  //       unselected_factors?.forEach((path) => {
  //         const index = factors.indexOf(path);
  //         if (index == -1) return;
  //         factors.splice(index, 1);
  //       });
  //       factors.push(d);

  //       d3.selectAll(".link1").attr("stroke", "#ccc");

  //       let paths = allPathId.concat();

  //       factors.forEach((link) => {
  //         paths = paths.filter((path) => path.includes(link.target));
  //       });

  //       console.log(paths);

  //       // const path = test2.find((ids) => ids.find((id) => id == d.target));
  //       paths?.forEach((path) =>
  //         path.forEach((p, i) => {
  //           if (!path[i + 1]) return;
  //           d3.select(`#link${p}-${path[i + 1]}`).attr("stroke", "thistle");
  //         })
  //       );
  //     });
  //   d3.select("#buttons").append("br");
  // });
});
